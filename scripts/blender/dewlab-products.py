"""
Dewlab products for the shop's live 3D (Blender 4.x–5.x, bpy; tested on 5.2.2).

Builds the three products from site/DESIGN.md and exports each as a Draco-compressed GLB:
  public/models/dewlab-serum.glb   pebble sea-glass bottle + frosted collar + glass pipette with frosted bulb + apricot serum
  public/models/dewlab-mist.glb    slim rounded sea-glass spray + frosted overcap + dip tube + pale apricot mist
  public/models/dewlab-balm.glb    low thick-walled sea-glass jar + frosted domed lid + apricot balm

RUN (from the repo root; `brew install --cask blender` puts `blender` on PATH):
  blender -b -P scripts/blender/dewlab-products.py
  ... -- --render     also renders Cycles references (Metal GPU when available):
                      raw/blender/{serum-front,serum-34,mist,balm}-ref.png  on a seamless #EEF3F1 cyclorama (attach serum-front-ref.png to P1 + P6)
                      raw/blender/{serum-front,serum-34,mist,balm}-cut.png  transparent background + transparent glass (?static=1 fallback)
  ... -- --quick      with --render: 64 samples, for checking light and framing fast
  ... -- --only serum-front   with --render: just that view (serum-front · serum-34 · mist · balm · balm-open)
  ... -- --turntable  48-frame 360° turntables per product → raw/blender/turntable/<product>/NN.png (shop)
  ... -- --res 2160 --cut-only   with --render: a bigger transparent cut-out only (e.g. the reel cover object)
  ... -- --blend      also saves raw/blender/dewlab-products.blend to tweak by hand
  Check:  npx -y @gltf-transform/cli@4.5.1 inspect public/models/dewlab-serum.glb

Notes
- Real-world scale in metres (modelled in mm, converted). Each product's origin = centre of its base. The GLB is Y-up
  (glTF), Blender stays Z-up.
- Built by lathing 2D profiles (clean quad rings, triangle fans only at the poles), so the walls have real thickness.
  The serum bottle is squashed front-to-back into a pebble below the shoulder; the neck stays round.
- Glass: Principled BSDF transmission 1, IOR 1.45, pale aqua tint + Volume Absorption + glTF thickness, so the exporter
  writes KHR_materials_transmission / ior / volume.
- Liquids are NOT transmissive on purpose: three.js renders transmission from a pass that only sees opaque objects,
  so a transmissive serum inside a transmissive bottle would vanish on the web.
- Every object carries a custom property `dew_role` (glass, inner_glass, frost, etch, liquid), exported as glTF extras,
  so the web loader can tune materials by role (inner_glass → thin transparent glass, for the same reason).
- No textures, no UVs needed: pure materials keep the files tiny.
"""

import math
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix

ROOT = Path(__file__).resolve().parents[2]
MODELS = ROOT / "public" / "models"
RAW = ROOT / "raw" / "blender"
ARGS = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
MM = 0.001
SEG = 96  # segments around every lathe


# ---------------------------------------------------------------- helpers: colour, profiles, lathe


def srgb(hex_str, alpha=1.0):
    """'#EE7A3B' → linear RGBA for Blender colour sockets."""
    h = hex_str.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i : i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, alpha)


def superellipse(a, b, cz, n, t0, t1, steps):
    """Points (r, z) on a superellipse half-profile, angle t0 → t1 in degrees (−90 bottom, +90 top)."""
    pts = []
    for i in range(steps + 1):
        t = math.radians(t0 + (t1 - t0) * i / steps)
        c, s = math.cos(t), math.sin(t)
        r = a * abs(c) ** (2 / n)
        z = cz + b * math.copysign(abs(s) ** (2 / n), s)
        pts.append((r, z))
    return pts


def arc(cx, cz, rad, a0, a1, steps):
    """Points on a circular arc around (cx, cz), angles in degrees."""
    return [
        (cx + rad * math.cos(math.radians(a0 + (a1 - a0) * i / steps)), cz + rad * math.sin(math.radians(a0 + (a1 - a0) * i / steps)))
        for i in range(steps + 1)
    ]


def smooth(ctrl, per=8):
    """Catmull-Rom through control points [(r, z)] → a smooth profile (passes through every control point)."""
    pts = [ctrl[0]] + list(ctrl) + [ctrl[-1]]
    out = []
    for i in range(1, len(pts) - 2):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[i + 1], pts[i + 2]
        for k in range(per):
            t = k / per
            t2, t3 = t * t, t * t * t
            out.append(tuple(
                0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)
                for j in (0, 1)
            ))
    out.append(ctrl[-1])
    return out


def dedupe(pts, eps=1e-4):
    out = []
    for p in pts:
        if not out or abs(p[0] - out[-1][0]) > eps or abs(p[1] - out[-1][1]) > eps:
            out.append(p)
    return out


def r_at(profile, z):
    """Radius of a (bottom → top) profile at height z, by linear interpolation."""
    for (r0, z0), (r1, z1) in zip(profile, profile[1:]):
        if (z0 - z) * (z1 - z) <= 0 and z1 != z0:
            return r0 + (r1 - r0) * (z - z0) / (z1 - z0)
    return profile[-1][0]


def lathe(name, profile_mm, closed=False, squash=None, segments=SEG):
    """Revolve a 2D profile [(r, z) in mm] around Z into a mesh in metres.

    Open profiles must start and end on the axis (r = 0): the poles are merged into triangle fans, giving a closed solid.
    closed=True joins the last point back to the first (a ring-shaped solid that never touches the axis).
    squash(z_mm) → Y scale at that height (pebble shapes).
    """
    pts = dedupe(profile_mm)
    bm = bmesh.new()
    verts = [bm.verts.new((r * MM, 0.0, z * MM)) for r, z in pts]
    edges = [bm.edges.new((verts[i], verts[i + 1])) for i in range(len(verts) - 1)]
    if closed:
        edges.append(bm.edges.new((verts[-1], verts[0])))
    bmesh.ops.spin(
        bm, geom=verts + edges, cent=(0, 0, 0), axis=(0, 0, 1), dvec=(0, 0, 0),
        angle=math.tau, steps=segments, use_merge=True, use_duplicate=False,
    )
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-7)
    if squash:
        for v in bm.verts:
            v.co.y *= squash(v.co.z / MM)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for poly in mesh.polygons:
        poly.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def surface_bead(profile, z, radius, sink=0.06, steps=10):
    """Closed round section (a thin bead) centred on a (bottom → top) profile at height z, pushed out along the
    surface normal so it sits half-proud of the surface: an engraved line that reads on any slope."""
    r0, r1 = r_at(profile, z - 0.4), r_at(profile, z + 0.4)
    tr, tz = r1 - r0, 0.8
    n = math.hypot(tr, tz)
    nr, nz = tz / n, -tr / n  # outward normal (away from the axis)
    cr, cz = r_at(profile, z) + nr * (radius - sink), z + nz * (radius - sink)
    return [(cr + radius * math.cos(2 * math.pi * i / steps), cz + radius * math.sin(2 * math.pi * i / steps)) for i in range(steps)]


def ring_profile(r_in, r_out, z0, z1, round_mm=0.8, steps=4):
    """Closed rectangular ring section with rounded corners (for collars, tubes, etched bands)."""
    k = min(round_mm, (r_out - r_in) / 2.01, (z1 - z0) / 2.01)
    return (
        arc(r_in + k, z0 + k, k, 180, 270, steps)
        + arc(r_out - k, z0 + k, k, 270, 360, steps)
        + arc(r_out - k, z1 - k, k, 0, 90, steps)
        + arc(r_in + k, z1 - k, k, 90, 180, steps)
    )


# ---------------------------------------------------------------- materials


def gltf_output_group():
    """The 'glTF Material Output' node group the exporter reads Thickness from."""
    ng = bpy.data.node_groups.get("glTF Material Output")
    if ng:
        return ng
    ng = bpy.data.node_groups.new("glTF Material Output", "ShaderNodeTree")
    # Blender 5.x inlines (flattens) materials before export unless this group has an "Occlusion" socket, and the
    # flattened copy loses Thickness → no KHR_materials_volume. An unlinked Occlusion socket exports nothing.
    for sock in ("Occlusion", "Thickness"):
        if hasattr(ng, "interface"):  # Blender 4.x / 5.x
            ng.interface.new_socket(name=sock, in_out="INPUT", socket_type="NodeSocketFloat")
        else:  # 3.x fallback
            ng.inputs.new("NodeSocketFloat", sock)
    return ng


def principled(name, color, roughness, transmission=0.0, ior=1.45, emission=None, emission_strength=0.0, coat=0.0, subsurface=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")

    def put(names, value):
        for n in names if isinstance(names, (list, tuple)) else [names]:
            if n in bsdf.inputs:
                bsdf.inputs[n].default_value = value
                return

    put("Base Color", srgb(color))
    put("Roughness", roughness)
    put("IOR", ior)
    put(["Transmission Weight", "Transmission"], transmission)
    put(["Coat Weight", "Clearcoat"], coat)
    put(["Subsurface Weight", "Subsurface"], subsurface)
    if emission:
        put(["Emission Color", "Emission"], srgb(emission))
        put("Emission Strength", emission_strength)
    mat.diffuse_color = srgb(color)  # viewport colour
    return mat


def glass(name, color="#EAF7F5", roughness=0.03, tint="#9FD9D0", density=16.0, thickness_mm=2.5):
    """Clear sea-glass: near-clear face-on (so the serum keeps its colour), aqua where the glass is thick (edges,
    base) through the volume tint: transmission + IOR 1.45 + volume (→ KHR_materials_volume)."""
    mat = principled(name, color, roughness, transmission=1.0, ior=1.45)
    nt = mat.node_tree
    out = nt.nodes.get("Material Output")
    vol = nt.nodes.new("ShaderNodeVolumeAbsorption")
    vol.inputs["Color"].default_value = srgb(tint)
    vol.inputs["Density"].default_value = density
    nt.links.new(vol.outputs["Volume"], out.inputs["Volume"])
    grp = nt.nodes.new("ShaderNodeGroup")
    grp.node_tree = gltf_output_group()
    grp.inputs["Thickness"].default_value = thickness_mm * MM
    grp.location = (out.location.x, out.location.y - 220)
    return mat


MATS = {}


def build_materials():
    MATS["glass"] = glass("Dew Sea Glass")
    MATS["inner_glass"] = glass("Dew Thin Glass", color="#C4E6E1", roughness=0.04, tint="#A9DCD5", density=4.0, thickness_mm=0.9)
    # frosted pale aqua (not white): tinted base, medium roughness, denser tint so the frost keeps colour and form
    MATS["frost"] = glass("Dew Frost", color="#9ED6CD", roughness=0.3, tint="#86CCC1", density=14.0, thickness_mm=6.0)
    # the balm lid is a thick solid dome: at the normal frost roughness it refracts radial streaks, so it gets more
    MATS["lid_frost"] = glass("Dew Lid Frost", color="#9ED6CD", roughness=0.55, tint="#86CCC1", density=14.0, thickness_mm=14.0)
    MATS["etch"] = principled("Dew Etch", "#DCEFEB", 0.5, transmission=0.85)
    MATS["serum"] = principled("Dew Serum", "#EE7A3B", 0.06, emission="#EE7A3B", emission_strength=0.04, coat=0.6)
    MATS["mist"] = principled("Dew Mist", "#F4A26B", 0.05, emission="#F4A26B", emission_strength=0.03, coat=0.6)
    MATS["balm"] = principled("Dew Balm", "#EE8A4F", 0.45, subsurface=0.3, coat=0.15)
    MATS["orifice"] = principled("Dew Orifice", "#2C4A47", 0.5)


def swirl(obj, z_base_mm, r_mm, h_mm, lobes=3, turns=0.9, depth=0.16):
    """Turn a lathed peak into a soft swirl: lobes that spiral up the peak (radius ripple + twist by height)."""
    for v in obj.data.vertices:
        z, x, y = v.co.z / MM, v.co.x / MM, v.co.y / MM
        r = math.hypot(x, y)
        if z <= z_base_mm + 0.05 or r > r_mm:
            continue
        h = min(1.0, (z - z_base_mm) / h_mm)
        th = math.atan2(y, x)
        r2 = r * (1 + depth * math.sin(lobes * th) * math.sin(math.pi * min(1.0, h * 1.2)))
        th2 = th + turns * math.tau * h / lobes
        v.co.x, v.co.y = r2 * math.cos(th2) * MM, r2 * math.sin(th2) * MM
    obj.data.update()


def part(obj, role, mat_key, parent):
    obj.data.materials.append(MATS[mat_key])
    obj["dew_role"] = role
    obj.parent = parent
    return obj


def root(name):
    empty = bpy.data.objects.new(name, None)
    empty.empty_display_type = "PLAIN_AXES"
    empty.empty_display_size = 0.02
    empty["dew_product"] = name
    bpy.context.scene.collection.objects.link(empty)
    return empty


# ---------------------------------------------------------------- product 1: Dew Drop Serum (pebble bottle + pipette)


def build_serum():
    R = root("Dewlab_Serum")
    A, B, N = 29.0, 32.0, 2.7  # body half-width, half-height, superellipse exponent
    CZ = B  # body centre height (base at z = 0)
    WALL, FLOOR = 2.6, 4.0
    NECK_R, NECK_RI = 9.5, 6.6
    # outer body: bottom pole → up until the radius narrows to the neck
    outer_body = [p for p in superellipse(A, B, CZ, N, -90, 90, 80) if not (p[1] > CZ and p[0] < NECK_R)]
    z_shoulder = outer_body[-1][1]
    z_lip = z_shoulder + 9.0
    outer = outer_body + [(NECK_R, z_shoulder + 0.6), (NECK_R, z_lip - 1.0)] + arc(NECK_R - 1.0, z_lip - 1.0, 1.0, 0, 90, 4)
    inner_top = [(NECK_RI + 0.0, z_lip), (NECK_RI, z_shoulder - 1.5)]
    inner_body = [
        p
        for p in superellipse(A - WALL, B - (WALL + FLOOR) / 2, CZ + (FLOOR - WALL) / 2, N, 90, -90, 80)
        if not (p[1] > CZ and p[0] < NECK_RI)
    ]
    profile = [(0.0, 0.0)] + outer[1:] + inner_top + inner_body[:-1] + [(0.0, inner_body[-1][1])]

    def squash(z):  # pebble below the shoulder, round neck
        z0, z1 = z_shoulder - 14.0, z_shoulder
        k = min(1.0, max(0.0, (z - z0) / (z1 - z0)))
        k = k * k * (3 - 2 * k)
        return 0.72 + (1.0 - 0.72) * k

    part(lathe("Serum.Bottle", profile, squash=squash), "glass", "glass", R)

    # etched ring on the shoulder, just under the neck: a fine 0.35 mm bead half-sunk into the glass, following the
    # surface (the shoulder is nearly flat there, so a vertical band would disappear into it)
    z_ring = z_shoulder - 2.6
    part(lathe("Serum.Etch", surface_bead(outer_body, z_ring, 0.175), closed=True, squash=squash, segments=SEG), "etch", "etch", R)

    # serum: inner body shrunk 0.3 mm, filled to 74 % of the inner height, flat top
    inner_up = list(reversed(inner_body))  # bottom → top
    z_floor = inner_up[0][1]
    z_fill = z_floor + (z_shoulder - z_floor) * 0.74
    liquid = [(0.0, z_floor + 0.3)] + [(max(r - 0.3, 0.0), z) for r, z in inner_up[1:] if z_floor + 0.3 < z < z_fill] + [(r_at(inner_up, z_fill) - 0.3, z_fill), (0.0, z_fill)]
    part(lathe("Serum.Liquid", liquid, squash=squash), "liquid", "serum", R)

    # collar: frosted glass ring over the neck, closed top with a hole for the pipette tube
    c0, c1 = z_shoulder + 1.2, z_lip + 5.0
    # three soft grooves around the skirt give the frosted collar visible detail
    grooves = []
    for gz in (c0 + 3.4, c0 + 5.6, c0 + 7.8):
        grooves += [(11.6, gz - 0.55), (11.32, gz - 0.2), (11.32, gz + 0.2), (11.6, gz + 0.55)]
    collar = (
        [(3.9, c1 - 2.2), (NECK_R + 0.25, c1 - 2.2), (NECK_R + 0.25, c0)]
        + arc(11.6 - 1.2, c0 + 1.2, 1.2, 270, 360, 4)
        + grooves
        + arc(11.6 - 2.0, c1 - 2.0, 2.0, 0, 90, 6)
        + [(3.9, c1)]
    )
    part(lathe("Serum.Collar", collar, closed=True), "frost", "frost", R)

    # pipette bulb: straight, vertical, symmetric frosted glass: a slight waist above the collar, a round body,
    # a rounded dome top (≈ 23 mm tall). A pure lathe: no curves, no modifiers, no bend.
    b0 = c1
    body = smooth([(6.0, b0 + 0.8), (5.9, b0 + 3.0), (5.4, b0 + 6.0), (5.6, b0 + 9.0), (6.4, b0 + 12.5), (6.7, b0 + 15.5), (6.6, b0 + 18.0)], 8)
    dome_c = b0 + 18.0
    dome = [(6.6 * math.cos(math.radians(t)), dome_c + 6.6 * math.sin(math.radians(t))) for t in range(10, 91, 10)]
    bulb = [(0.0, b0), (5.4, b0)] + arc(5.4, b0 + 0.6, 0.6, 270, 360, 3) + body + dome
    bulb[-1] = (0.0, bulb[-1][1])
    part(lathe("Serum.Bulb", bulb), "frost", "frost", R)

    # pipette tube: thin glass, tapered tip near the floor, top hidden in the collar
    t_tip, t_top = z_floor + 3.0, c1 - 0.5
    tube = [(0.7, t_tip), (1.3, t_tip), (3.3, t_tip + 9.0), (3.3, t_top), (2.4, t_top), (2.4, t_tip + 9.5), (0.7, t_tip + 1.0)]
    part(lathe("Serum.Tube", tube, closed=True, segments=48), "inner_glass", "inner_glass", R)
    # serum held in the tube, rising a few mm above the bottle's liquid line so the pipette reads as dipped in serum
    s_top = z_fill + 6.0
    tube_liquid = [(0.0, t_tip + 1.4), (0.6, t_tip + 1.4), (2.2, t_tip + 9.6), (2.2, s_top), (0.0, s_top)]
    part(lathe("Serum.TubeLiquid", tube_liquid, segments=48), "liquid", "serum", R)
    return R


# ---------------------------------------------------------------- product 2: Morning Mist (slim spray)


def build_mist():
    """Slim sea-glass spray with a fine-mist pump: crimp ferrule on the neck, a thin collar ring, a short frosted
    actuator with a front nozzle hole, a slim dip tube. 43 mm wide × 131 mm tall."""
    R = root("Dewlab_Mist")
    A, B, N = 21.5, 53.9, 3.4
    CZ = B
    WALL, FLOOR = 2.2, 3.5
    NECK_R, NECK_RI = 8.0, 5.6
    outer_body = [p for p in superellipse(A, B, CZ, N, -90, 90, 90) if not (p[1] > CZ and p[0] < NECK_R)]
    z_sh = outer_body[-1][1]
    z_lip = z_sh + 7.0
    outer = outer_body + [(NECK_R, z_sh + 0.5), (NECK_R, z_lip - 0.8)] + arc(NECK_R - 0.8, z_lip - 0.8, 0.8, 0, 90, 4)
    inner_body = [
        p
        for p in superellipse(A - WALL, B - (WALL + FLOOR) / 2, CZ + (FLOOR - WALL) / 2, N, 90, -90, 90)
        if not (p[1] > CZ and p[0] < NECK_RI)
    ]
    profile = [(0.0, 0.0)] + outer[1:] + [(NECK_RI, z_lip), (NECK_RI, z_sh - 1.2)] + inner_body[:-1] + [(0.0, inner_body[-1][1])]
    part(lathe("Mist.Bottle", profile), "glass", "glass", R)

    inner_up = list(reversed(inner_body))
    z_floor = inner_up[0][1]
    z_fill = z_floor + (z_sh - z_floor) * 0.84
    liquid = [(0.0, z_floor + 0.3)] + [(max(r - 0.3, 0.0), z) for r, z in inner_up[1:] if z_floor + 0.3 < z < z_fill] + [(r_at(inner_up, z_fill) - 0.3, z_fill), (0.0, z_fill)]
    part(lathe("Mist.Liquid", liquid), "liquid", "mist", R)

    # crimp ferrule over the neck: frosted aqua, closed top with a hole for the stem
    f0, f1 = z_lip - 5.5, z_lip + 1.6
    ferrule = [(2.4, f1 - 1.2), (NECK_R + 0.15, f1 - 1.2), (NECK_R + 0.15, f0)] + arc(9.3 - 0.5, f0 + 0.5, 0.5, 270, 360, 3) + arc(9.3 - 0.8, f1 - 0.8, 0.8, 0, 90, 3) + [(2.4, f1)]
    part(lathe("Mist.Ferrule", ferrule, closed=True), "frost", "frost", R)
    # thin collar ring between the ferrule and the actuator
    c0 = f1 + 0.6
    part(lathe("Mist.Collar", ring_profile(2.4, 6.6, c0, c0 + 1.1, 0.4, 3), closed=True), "frost", "frost", R)
    # stem: a short glass rod carrying the actuator
    part(lathe("Mist.Stem", ring_profile(0.0001, 2.1, f1 - 3.0, c0 + 3.0, 0.3, 2), closed=True, segments=32), "inner_glass", "inner_glass", R)

    # actuator: short frosted-aqua cylinder, softly domed top, ends at 131 mm
    a0, a_top, ra = c0 + 2.4, 131.0, 7.2
    actuator = [(0.0, a0), (ra - 1.0, a0)] + arc(ra - 1.0, a0 + 1.0, 1.0, 270, 360, 3) + [(ra, a_top - 2.6)] + arc(ra - 2.0, a_top - 2.6, 2.0, 0, 70, 4)
    actuator += [(r, a_top - (0.6 * (r / (ra - 1.4)) ** 2)) for r in (4.0, 2.5, 1.2)] + [(0.0, a_top)]
    act = part(lathe("Mist.Actuator", actuator), "frost", "frost", R)

    # nozzle: a small round boss with a dark orifice on the actuator's front (−Y), lathed along Z then turned to face front
    z_noz = a0 + (a_top - a0) * 0.58
    boss = lathe("Mist.Nozzle", [(0.0, 0.0), (1.25, 0.0), (1.25, 0.5)] + arc(1.0, 0.5, 0.25, 0, 90, 3) + [(0.55, 0.75), (0.45, 0.45), (0.0, 0.45)], segments=32)
    orifice = lathe("Mist.Orifice", [(0.0, 0.3), (0.45, 0.3), (0.45, 0.46), (0.0, 0.46)], segments=24)
    for o in (boss, orifice):
        o.data.transform(Matrix.Translation((0.0, -(ra - 0.25) * MM, z_noz * MM)) @ Matrix.Rotation(math.radians(90), 4, "X"))
    part(boss, "frost", "frost", R)
    part(orifice, "orifice", "orifice", R)

    # slim dip tube from the floor up into the ferrule
    tube = ring_profile(0.55, 0.95, z_floor + 1.5, f1 - 1.4, 0.2, 2)
    part(lathe("Mist.DipTube", tube, closed=True, segments=32), "inner_glass", "inner_glass", R)
    return R


# ---------------------------------------------------------------- product 3: Night Dew balm (low jar)


def build_balm():
    R = root("Dewlab_Balm")
    RO, H, WALL, FLOOR = 34.0, 36.0, 4.0, 7.0
    outer = [(0.0, 0.0), (RO - 5.0, 0.0)] + arc(RO - 5.0, 5.0, 5.0, 270, 360, 6) + [(RO, H - 1.5)] + arc(RO - 1.5, H - 1.5, 1.5, 0, 90, 4)
    ri = RO - WALL
    inner = [(ri + 0.0, H), (ri, FLOOR + 5.0)] + arc(ri - 5.0, FLOOR + 5.0, 5.0, 0, -90, 6) + [(0.0, FLOOR)]
    part(lathe("Balm.Jar", outer + inner), "glass", "glass", R)

    # balm: fills the jar wall to wall to 75 % of the inner height, a flat top with one soft swirled peak in the
    # middle. Its side and floor sit 1.5 mm INSIDE the thick glass on purpose: any air film between cream and glass
    # makes the wall reflect (the jar looked half empty), and the flat top meets the inner wall at a right angle,
    # so cream and glass cross on a clean circle (a curved edge crossing the glass at a shallow angle left teeth)
    bt = FLOOR + (H - FLOOR) * 0.75
    sink = 1.5
    peak_r, peak_h = 11.0, 4.2
    top = [(peak_r + 6.0 * (1 - i / 4), bt) for i in range(4)]  # flat ring
    top += [(peak_r * (1 - t), bt + peak_h * (0.5 - 0.5 * math.cos(math.pi * t)) ** 0.9) for t in [i / 14 for i in range(15)]]
    balm = [(0.0, FLOOR - sink), (ri + sink, FLOOR - sink), (ri + sink, bt), (ri - 2.0, bt)] + top
    balm[-1] = (0.0, balm[-1][1])
    blob = part(lathe("Balm.Balm", balm), "liquid", "balm", R)
    swirl(blob, bt, peak_r, peak_h)

    # frosted domed lid resting on the rim
    l0 = H + 0.2
    lid = [(0.0, l0), (RO + 0.6 - 2.0, l0)] + arc(RO + 0.6 - 2.0, l0 + 2.0, 2.0, 270, 360, 4) + [(RO + 0.6, l0 + 9.0)]
    # fine steps (3°) so the dome has no star-shaped shading at its centre
    lid += [((RO + 0.6) * math.cos(math.radians(t)), l0 + 9.0 + 5.0 * math.sin(math.radians(t))) for t in range(3, 91, 3)]
    lid[-1] = (0.0, lid[-1][1])
    part(lathe("Balm.Lid", lid), "frost", "lid_frost", R)
    return R


# ---------------------------------------------------------------- export


def export(root_obj, filename):
    for o in bpy.context.scene.objects:
        o.select_set(False)
    root_obj.select_set(True)
    for c in root_obj.children_recursive:
        c.select_set(True)
    bpy.context.view_layer.objects.active = root_obj
    MODELS.mkdir(parents=True, exist_ok=True)
    out = MODELS / filename
    bpy.ops.export_scene.gltf(
        filepath=str(out),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_extras=True,
        export_materials="EXPORT",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_draco_position_quantization=14,
        export_draco_normal_quantization=12,
    )
    print(f"[dewlab] {out.relative_to(ROOT)}  {out.stat().st_size / 1024:.0f} KB")


# ---------------------------------------------------------------- optional reference renders (Cycles, Metal GPU)


def use_gpu(scene):
    """Cycles on the GPU (Metal on Apple silicon, else CUDA/OptiX/HIP); falls back to CPU."""
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for backend in ("METAL", "OPTIX", "CUDA", "HIP", "ONEAPI"):
        try:
            prefs.compute_device_type = backend
        except TypeError:
            continue
        prefs.get_devices()
        gpus = [d for d in prefs.devices if d.type != "CPU"]
        if gpus:
            for d in prefs.devices:
                d.use = d.type != "CPU"
            scene.cycles.device = "GPU"
            print(f"[dewlab] Cycles on {backend}: {', '.join(d.name for d in gpus)}")
            return
    scene.cycles.device = "CPU"
    print("[dewlab] no GPU found, Cycles on CPU")


CYC_GLOW = 11.0  # backdrop brightness as the camera sees it (tuned so AgX at −1 EV lands near #EEF3F1)


def cyclorama(scene, color="#EEF3F1"):
    """One seamless curved sweep: floor → 35 cm radius cove → back wall, 6 m wide, no edges in frame."""
    prof = [(-3.0, 0.0), (0.18, 0.0)] + [
        (0.18 + 0.35 * math.sin(math.radians(t)), 0.35 - 0.35 * math.cos(math.radians(t))) for t in range(6, 91, 6)
    ] + [(0.53, 3.0)]
    bm = bmesh.new()
    left = [bm.verts.new((-3.0, y, z)) for y, z in prof]
    right = [bm.verts.new((3.0, y, z)) for y, z in prof]
    for i in range(len(prof) - 1):
        bm.faces.new((left[i], right[i], right[i + 1], left[i + 1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new("Cyclorama")
    bm.to_mesh(mesh)
    bm.free()
    for poly in mesh.polygons:
        poly.use_smooth = True
    obj = bpy.data.objects.new("Cyclorama", mesh)
    # the camera (and rays through glass) see a bright self-lit #EEF3F1 sweep; reflections and lighting see a plain soft surface,
    # so the glass mirrors no glow and no milky veil covers the serum (Light Path → Is Camera Ray)
    mat = principled("Cyclorama", color, 0.85)
    nt = mat.node_tree
    out, bsdf = nt.nodes.get("Material Output"), nt.nodes.get("Principled BSDF")
    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = srgb("#E2F1EC")  # a touch more mint: AgX desaturates near-whites
    # contact shadow: the glow dims where geometry is close (ambient occlusion within 4 cm) → 0.62–1.0 × glow
    ao = nt.nodes.new("ShaderNodeAmbientOcclusion")
    ao.samples = 24
    ao.inputs["Distance"].default_value = 0.04
    ao_mix = nt.nodes.new("ShaderNodeMapRange")
    ao_mix.inputs["To Min"].default_value = CYC_GLOW * 0.62
    ao_mix.inputs["To Max"].default_value = CYC_GLOW
    nt.links.new(ao.outputs["AO"], ao_mix.inputs["Value"])
    nt.links.new(ao_mix.outputs["Result"], emit.inputs["Strength"])
    path = nt.nodes.new("ShaderNodeLightPath")
    mix = nt.nodes.new("ShaderNodeMixShader")
    keep = nt.nodes.new("ShaderNodeMath")  # 80 % glow, 20 % real lit surface → a soft contact shadow stays
    keep.operation = "MULTIPLY"
    keep.inputs[1].default_value = 0.7
    seen = nt.nodes.new("ShaderNodeMath")  # camera rays OR rays through glass see the glow
    seen.operation = "MAXIMUM"
    nt.links.new(path.outputs["Is Camera Ray"], seen.inputs[0])
    nt.links.new(path.outputs["Is Transmission Ray"], seen.inputs[1])
    nt.links.new(seen.outputs["Value"], keep.inputs[0])
    nt.links.new(keep.outputs["Value"], mix.inputs["Fac"])
    nt.links.new(bsdf.outputs["BSDF"], mix.inputs[1])
    nt.links.new(emit.outputs["Emission"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
    obj.data.materials.append(mat)
    scene.collection.objects.link(obj)
    return obj


def render_liquids():
    """Render-only: serum and mist become see-through apricot liquids (IOR 1.36 + volume tint), as real serum looks.
    The GLBs were already exported with the opaque, web-safe versions (three.js cannot show transmission in transmission)."""
    # (key, base colour, volume tint, density /m, transmission): part see-through, part lit apricot body
    for key, base, absorb, density, trans in (("serum", "#FF7A12", "#FF8A20", 60.0, 0.12), ("mist", "#FF9A55", "#EE7A3B", 22.0, 0.6)):
        nt = MATS[key].node_tree
        bsdf = nt.nodes.get("Principled BSDF")
        bsdf.inputs["Base Color"].default_value = srgb(base)
        bsdf.inputs["Transmission Weight"].default_value = trans
        bsdf.inputs["IOR"].default_value = 1.36
        bsdf.inputs["Roughness"].default_value = 0.02
        bsdf.inputs["Emission Strength"].default_value = 0.0
        bsdf.inputs["Coat Weight"].default_value = 0.0  # a coat adds a white veil under the glass
        vol = nt.nodes.new("ShaderNodeVolumeAbsorption")
        vol.inputs["Color"].default_value = srgb(absorb)
        vol.inputs["Density"].default_value = density
        nt.links.new(vol.outputs["Volume"], nt.nodes.get("Material Output").inputs["Volume"])


def setup_render_scene():
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    use_gpu(scene)
    scene.cycles.samples = 64 if "--quick" in ARGS else 512
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 24
    scene.cycles.transmission_bounces = 24
    scene.cycles.transparent_max_bounces = 24
    scene.cycles.glossy_bounces = 8
    # glass parts cast no shadows in the renders, so the liquids and the balm get light directly (the standard
    # product-render trick: no dark interiors, no caustic fireflies)
    scene.cycles.caustics_refractive = False
    scene.cycles.blur_glossy = 0.0  # any glossy blur veils the liquid behind the glass
    scene.cycles.sample_clamp_indirect = 8.0
    for o in scene.objects:
        if o.get("dew_role") in ("glass", "inner_glass", "frost", "etch") or o.name in ("Serum.Liquid", "Serum.TubeLiquid", "Mist.Liquid"):
            o.visible_shadow = False
    render_liquids()
    MATS["balm"].node_tree.nodes.get("Principled BSDF").inputs["Base Color"].default_value = srgb("#EE8A4F")
    # AgX keeps highlights from clipping, −1 EV so the glass keeps its edges. Brightness comes from a strong soft
    # ambient (world) instead of hard lights, which is what blew the glass out before.
    scene.view_settings.view_transform = "AgX"
    for look in ("AgX - Base Contrast", "None"):
        try:
            scene.view_settings.look = look
            break
        except TypeError:
            continue
    scene.view_settings.exposure = -1.0
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"

    world = bpy.data.worlds.new("Mist")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = srgb("#EEF3F1")
    # dim for reflections (no milky veil on the glass), bright for rays passing through glass
    # (no dark bands inside the thick jar walls): Light Path → Is Transmission Ray
    wnt = world.node_tree
    path = wnt.nodes.new("ShaderNodeLightPath")
    strength = wnt.nodes.new("ShaderNodeMapRange")
    strength.inputs["To Min"].default_value = 0.35
    strength.inputs["To Max"].default_value = 2.4
    wnt.links.new(path.outputs["Is Transmission Ray"], strength.inputs["Value"])
    wnt.links.new(strength.outputs["Result"], bg.inputs["Strength"])
    scene.world = world

    cyc = cyclorama(scene)
    target = bpy.data.objects.new("Target", None)
    scene.collection.objects.link(target)

    def area(name, loc, size, power, color="#FFFFFF"):
        data = bpy.data.lights.new(name, "AREA")
        data.shape = "DISK"
        data.size = size
        data.energy = power
        data.color = srgb(color)[:3]
        obj = bpy.data.objects.new(name, data)
        obj.location = loc
        scene.collection.objects.link(obj)
        track = obj.constraints.new("TRACK_TO")
        track.target = target
        track.track_axis, track.up_axis = "TRACK_NEGATIVE_Z", "UP_Y"
        return obj

    area("Key", (-0.55, -0.5, 0.6), 0.9, 18, "#FFF6EC")  # cool-morning key, upper left, big and soft
    area("Rim", (0.45, 0.35, 0.3), 0.35, 9, "#E4F4F1")  # edge light for the glass outline
    area("Fill", (0.7, -0.55, 0.12), 1.0, 5)

    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = 85
    cam = bpy.data.objects.new("Camera", cam_data)
    scene.collection.objects.link(cam)
    cam_track = cam.constraints.new("TRACK_TO")
    cam_track.target = target
    cam_track.track_axis, cam_track.up_axis = "TRACK_NEGATIVE_Z", "UP_Y"
    scene.camera = cam
    return scene, cyc, target, cam


def shadow_puck(name, rx, ry, parent):
    """Invisible low disc (7 mm) that only casts a soft contact shadow on the sweep (the glass itself casts none)."""
    prof = [(0.0, 0.0), (rx - 1.0, 0.0)] + arc(rx - 1.0, 1.0, 1.0, 270, 360, 3) + arc(rx - 1.0, 6.0, 1.0, 0, 90, 3) + [(0.0, 7.0)]
    puck = lathe(name, prof, segments=48)
    puck.scale.y = ry / rx
    puck.parent = parent
    for attr in ("visible_camera", "visible_diffuse", "visible_glossy", "visible_transmission", "visible_volume_scatter"):
        setattr(puck, attr, False)
    return puck


def render(scene, path, res, target, cam, look_z, dist, angle=0.0, cut=False, cyc=None, elev=0.16, target_x=0.0):
    """angle: degrees the camera orbits round the product (0 = front, 35 = three-quarter).
    elev: camera height above the target as a fraction of the distance (0.16 = product height, 0.55 = from above)."""
    scene.render.resolution_x, scene.render.resolution_y = res
    target.location = (target_x, 0, look_z)
    a = math.radians(angle)
    cam.location = (target_x + dist * math.sin(a), -dist * math.cos(a), look_z + dist * elev)
    scene.render.film_transparent = cut
    if hasattr(scene.cycles, "film_transparent_glass"):
        scene.cycles.film_transparent_glass = cut
    if cyc:
        cyc.hide_render = cut
    RAW.mkdir(parents=True, exist_ok=True)
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    print(f"[dewlab] {path.relative_to(ROOT)}")


# ---------------------------------------------------------------- main


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_materials()
    products = {"serum": build_serum(), "mist": build_mist(), "balm": build_balm()}
    for key, r in products.items():
        export(r, f"dewlab-{key}.glb")

    if "--render" in ARGS:
        scene, cyc, target, cam = setup_render_scene()
        heights = {"serum": 0.101, "mist": 0.131, "balm": 0.050}
        # (file, product, camera angle): serum front + three-quarter, spray, jar (all at product height),
        # plus the jar open: lid resting beside it, swirl visible, three-quarter from slightly above
        views = [("serum-front", "serum", 0), ("serum-34", "serum", 35), ("mist", "mist", 20), ("balm", "balm", 20), ("balm-open", "balm", 32)]
        # shadow pucks: invisible low discs at each base that only cast a soft contact shadow on the sweep
        # (the glass itself casts no shadow in the renders, see setup_render_scene)
        for key, (rx, ry) in {"serum": (27.0, 19.5), "mist": (20.5, 20.5), "balm": (40.0, 40.0)}.items():
            # the jar's disc is a little wider than its base: it is wide and low, so a disc under its own footprint
            # stays hidden from product-height cameras and its shadow read weaker than the others'
            shadow_puck(f"{key}.ShadowPuck", rx, ry, products[key])
        lid = bpy.data.objects["Balm.Lid"]
        lid_home = lid.location.copy()
        only = ARGS[ARGS.index("--only") + 1] if "--only" in ARGS else None
        for name, key, angle in views:
            if only and name != only:
                continue
            for k, r in products.items():
                for o in [r, *r.children_recursive]:
                    o.hide_render = k != key
            h = heights[key]
            dist = max(h, 0.07) * 4.2
            framing = {}
            lid_puck = None
            if name == "balm-open":
                # lid lifted off and set down flat beside the jar (right, a little behind), with its own soft shadow
                lid.location = (lid_home.x + 0.076, lid_home.y + 0.024, lid_home.z - 0.0362)
                lid_puck = shadow_puck("Balm.LidShadowPuck", 38.0, 38.0, lid)
                lid_puck.location.z = 0.0362  # the disc sits at the lid's base, on the floor
                dist, framing = 0.36, {"elev": 0.55, "target_x": 0.042}
            res = int(ARGS[ARGS.index("--res") + 1]) if "--res" in ARGS else 1080
            if "--cut-only" not in ARGS:
                render(scene, RAW / f"{name}-ref.png", (res, res), target, cam, h * 0.5, dist, angle, cyc=cyc, **framing)
            suffix = "" if res == 1080 else f"-{res}"
            render(scene, RAW / f"{name}-cut{suffix}.png", (res, res), target, cam, h * 0.5, dist, angle, cut=True, cyc=cyc, **framing)
            if lid_puck:
                bpy.data.objects.remove(lid_puck, do_unlink=True)
                lid.location = lid_home

    if "--turntable" in ARGS:
        # 48-frame 360° turntables for the shop (transparent background, transparent glass, approved render materials).
        # The product turns, camera + lights stay put, so highlights glide across the glass like a real turntable.
        # Output: raw/blender/turntable/<product>/00.png … 47.png (→ WebP for the site).
        scene, cyc, target, cam = setup_render_scene()
        scene.cycles.samples = 48 if "--quick" in ARGS else 128
        frames = 48
        heights = {"serum": 0.101, "mist": 0.131, "balm": 0.050}
        only = ARGS[ARGS.index("--only") + 1] if "--only" in ARGS else None
        for key, r in products.items():
            if only and key != only:
                continue
            for k, other in products.items():
                for o in [other, *other.children_recursive]:
                    o.hide_render = k != key
            out = RAW / "turntable" / key
            out.mkdir(parents=True, exist_ok=True)
            h = heights[key]
            dist = max(h, 0.07) * 4.2
            for i in range(frames):
                r.rotation_euler = (0.0, 0.0, math.tau * i / frames)
                render(scene, out / f"{i:02d}.png", (720, 720), target, cam, h * 0.5, dist, 0.0, cut=True, cyc=cyc)
            r.rotation_euler = (0.0, 0.0, 0.0)

    if "--blend" in ARGS:
        RAW.mkdir(parents=True, exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=str(RAW / "dewlab-products.blend"))
        print(f"[dewlab] {(RAW / 'dewlab-products.blend').relative_to(ROOT)}")


main()

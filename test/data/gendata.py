import json
import os
import struct
from pathlib import Path

import numpy as np


def write_tm3(path: Path, x: np.ndarray, y: np.ndarray, z: np.ndarray, v: np.ndarray, surf_name="surface", value_name="value"):
    """
    Write a minimal TM3 buffer for a single surface/value and save to `path`.
    Arrays must be 2D and the same shape.
    """
    assert x.shape == y.shape == z.shape == v.shape
    ny, nx = x.shape
    n_verts = nx * ny
    n_tris = (nx - 1) * (ny - 1) * 2
    n_values = 1

    r_max = float(np.sqrt(x**2 + y**2 + z**2).max())
    x_range = (float(x.min()), float(x.max()))
    y_range = (float(y.min()), float(y.max()))
    z_range = (float(z.min()), float(z.max()))
    v_range = (float(v.min()), float(v.max()))

    # Build vertices (x, y, z) flattened row-major
    vertices = np.stack([x, y, z], axis=-1).reshape(-1).astype(np.float32)

    # Build triangle indices
    indices = []
    for j in range(ny - 1):
        for i in range(nx - 1):
            base = j * nx + i
            indices.extend([base, base + nx, base + nx + 1])
            indices.extend([base, base + nx + 1, base + 1])
    indices = np.array(indices, dtype=np.uint32)

    values = v.reshape(-1).astype(np.float32)

    def pad_name(name: str) -> bytes:
        b = name.encode("ascii")
        if len(b) > 96:
            b = b[:96]
        return b.ljust(96, b"\x00")

    buf = bytearray()
    buf.extend(struct.pack("<i", 1))  # nSteps
    buf.extend(struct.pack("<i", 1))  # nSurfs

    # Per-surface header
    buf.extend(pad_name(surf_name))
    buf.extend(struct.pack("<iii", n_verts, n_tris, n_values))
    buf.extend(struct.pack("<fffffff", r_max, x_range[0], x_range[1], y_range[0], y_range[1], z_range[0], z_range[1]))

    # Vertex and index data
    buf.extend(vertices.tobytes())
    buf.extend(indices.tobytes())

    # Value block
    buf.extend(pad_name(value_name))
    buf.extend(struct.pack("<ff", v_range[0], v_range[1]))
    buf.extend(values.tobytes())

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(buf)


def write_tm3_surfaces(path: Path, surfaces: list):
    """
    Write a TM3 buffer with multiple surfaces (single step).
    surfaces: list of dicts with keys {name, x, y, z, v}
    """
    assert surfaces, "Need at least one surface"

    def pad_name(name: str) -> bytes:
        b = name.encode("ascii")
        if len(b) > 96:
            b = b[:96]
        return b.ljust(96, b"\x00")

    buf = bytearray()
    buf.extend(struct.pack("<i", 1))  # nSteps
    buf.extend(struct.pack("<i", len(surfaces)))  # nSurfs

    for surf in surfaces:
        x, y, z, v = surf["x"], surf["y"], surf["z"], surf["v"]
        assert x.shape == y.shape == z.shape == v.shape
        ny, nx = x.shape
        n_verts = nx * ny
        n_tris = (nx - 1) * (ny - 1) * 2
        n_values = 1

        r_max = float(np.sqrt(x**2 + y**2 + z**2).max())
        x_range = (float(x.min()), float(x.max()))
        y_range = (float(y.min()), float(y.max()))
        z_range = (float(z.min()), float(z.max()))
        v_range = (float(v.min()), float(v.max()))

        vertices = np.stack([x, y, z], axis=-1).reshape(-1).astype(np.float32)
        indices = []
        for j in range(ny - 1):
            for i in range(nx - 1):
                base = j * nx + i
                indices.extend([base, base + nx, base + nx + 1])
                indices.extend([base, base + nx + 1, base + 1])
        indices = np.array(indices, dtype=np.uint32)
        values = v.reshape(-1).astype(np.float32)

        buf.extend(pad_name(surf["name"]))
        buf.extend(struct.pack("<iii", n_verts, n_tris, n_values))
        buf.extend(struct.pack("<fffffff", r_max, x_range[0], x_range[1], y_range[0], y_range[1], z_range[0], z_range[1]))
        buf.extend(vertices.tobytes())
        buf.extend(indices.tobytes())
        buf.extend(pad_name("value"))
        buf.extend(struct.pack("<ff", v_range[0], v_range[1]))
        buf.extend(values.tobytes())

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(buf)


def main():
    np.random.seed(0)
    sim_types = ["Red", "Orange", "Yellow", "Green", "Blue", "Purple"]
    mod_types = ["Basic", "Std", "Improved", "Best"]

    ndsets = 50
    nx = 3
    ny = 21
    nz = 21

    xv = np.linspace(0.0, 1.0, nx)
    yv = np.linspace(0.0, 1.0, ny)
    zv = np.linspace(0.0, 1.0, nz)
    z, y, x = np.meshgrid(zv, yv, xv, indexing="ij")

    r2 = (y - 0.5) ** 2 + (z - 0.5) ** 2
    shape = np.exp(-10 * r2)

    inletf = np.random.random(ndsets)
    exitf = np.random.random(ndsets)
    peak = np.random.random(ndsets)

    out_root = Path(__file__).parent
    cases_root = out_root
    cases_root.mkdir(parents=True, exist_ok=True)

    meta_data = []

    for n in range(ndsets):
        item_id = f"item_{n:02d}"
        label = f"Box {n}"
        background = x * (exitf[n] - inletf[n]) + inletf[n]
        f = background + peak[n] * shape
        ave = float(np.mean(f))
        std = float(np.std(f))
        meta_data.append(
            {
                "itemId": item_id,
                "Simulation type": np.random.choice(sim_types),
                "Model type": np.random.choice(mod_types),
                "Average f": ave,
                "Std dev f": std,
                "label": label,
            }
        )

        case_dir = cases_root / item_id
        case_dir.mkdir(exist_ok=True)
        zmid = (nz - 1) // 2

        # Line data at three x locations
        mid_x = nx // 2
        mid_y = ny // 2
        line_points = [{"x": round(float(z[k, mid_y, mid_x]), 5), "y": round(float(f[k, mid_y, mid_x]), 5)} for k in range(nz)]
        (case_dir / "f_line_z.json").write_text(json.dumps(line_points))

        # TM3 over the mid-x plane
        x_plane = x[:, :, mid_x]
        y_plane = y[:, :, mid_x]
        z_plane = z[:, :, mid_x]
        v_plane = f[:, :, mid_x]
        write_tm3(case_dir / "f_plane_xmid.tm3", x_plane, y_plane, z_plane, v_plane, surf_name="f_plane_xmid", value_name="f")

        # TM3 with all three constant-x surfaces
        surfaces = []
        for xi in range(nx):
            surfaces.append(
                {
                    "name": f"f_plane_x{xi}",
                    "x": x[:, :, xi],
                    "y": y[:, :, xi],
                    "z": z[:, :, xi],
                    "v": f[:, :, xi],
                }
            )
        write_tm3_surfaces(case_dir / "f_planes_all_x.tm3", surfaces)

    meta = {"data": meta_data}
    (out_root / "metaData.json").write_text(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()

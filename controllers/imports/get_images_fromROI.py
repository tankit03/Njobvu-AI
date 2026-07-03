#!/usr/bin/env python3
import argparse
import csv
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image


def parse_adc(adc_path: str) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    rows = []
    with open(adc_path, newline="") as f:
        reader = csv.reader(f)
        for row in reader:
            rows.append([float(v) for v in row])
    data = np.array(rows)
    return data


def get_image_columns(
    basename: str, data: np.ndarray
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    if basename.startswith("I"):
        x = data[:, 11].astype(int)
        y = data[:, 12].astype(int)
        startbyte = data[:, 13].astype(int)
    else:
        x = data[:, 15].astype(int)
        y = data[:, 16].astype(int)
        startbyte = data[:, 17].astype(int)
    return x, y, startbyte


def extract_images(
    roi_path: str,
    adc_path: str,
    roi_numbers: list[int] | None = None,
    outdir: str | None = None,
) -> list[dict]:
    basedir = os.path.dirname(roi_path)
    basename = os.path.splitext(os.path.basename(roi_path))[0]

    data = parse_adc(adc_path)
    if data.size == 0:
        print("ADC file is empty", file=sys.stderr)
        return []

    x, y, startbyte = get_image_columns(basename, data)

    valid = np.where(x > 0)[0] + 1
    if roi_numbers is None:
        roi_numbers = valid.tolist()
    else:
        roi_numbers = sorted(set(roi_numbers) & set(valid))

    if not roi_numbers:
        print("No valid ROI numbers to extract", file=sys.stderr)
        return []

    targets = []
    with open(roi_path, "rb") as f:
        for num in roi_numbers:
            idx = num - 1
            f.seek(int(startbyte[idx]))
            img_bytes = f.read(x[idx] * y[idx])
            img_array = np.frombuffer(img_bytes, dtype=np.uint8).reshape(
                y[idx], x[idx]
            )
            pid = f"{basename}_{num:05d}"
            targets.append(
                {
                    "targetNumber": num,
                    "pid": pid,
                    "image": img_array,
                }
            )

    if outdir:
        os.makedirs(outdir, exist_ok=True)
        for t in targets:
            Image.fromarray(t["image"]).save(
                os.path.join(outdir, f"{t['pid']}.png")
            )

    return targets


def main():
    parser = argparse.ArgumentParser(
        description="Extract ROI images from IFCB .roi files"
    )
    parser.add_argument("roi_file", help="Path to the .roi file")
    parser.add_argument(
        "-a", "--adc",
        default=None,
        help="Path to the .adc file (default: same basename as .roi in same dir)",
    )
    parser.add_argument(
        "-n", "--roi-numbers",
        type=int,
        nargs="+",
        default=None,
        help="Specific ROI number(s) to extract (default: all valid ROIs)",
    )
    parser.add_argument(
        "-o", "--outdir",
        default=None,
        help="Directory to save extracted images as PNGs",
    )
    args = parser.parse_args()

    if args.adc is None:
        p = Path(args.roi_file)
        args.adc = str(p.with_suffix(".adc"))

    if not os.path.exists(args.roi_file):
        print(f"ROI file not found: {args.roi_file}", file=sys.stderr)
        sys.exit(1)
    if not os.path.exists(args.adc):
        print(f"ADC file not found: {args.adc}", file=sys.stderr)
        sys.exit(1)

    targets = extract_images(
        args.roi_file,
        args.adc,
        roi_numbers=args.roi_numbers,
        outdir=args.outdir,
    )

    print(f"Extracted {len(targets)} ROI images")
    for t in targets:
        print(f"  {t['pid']}: {t['image'].shape}")


if __name__ == "__main__":
    main()

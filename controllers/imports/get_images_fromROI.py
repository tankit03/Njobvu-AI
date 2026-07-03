#!/usr/bin/env python3
import argparse
import csv
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image


class ImagePlaceholder:
    def __init__(self, shape):
        self.shape = shape


def parse_adc(adc_path: str) -> np.ndarray:
    rows = []
    expected_len = None
    with open(adc_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            if "," in line:
                parts = line.split(",")
            else:
                parts = line.split()
            
            try:
                row_vals = [float(v.strip()) for v in parts if v.strip()]
                if not row_vals:
                    continue
                if expected_len is None:
                    expected_len = len(row_vals)
                elif len(row_vals) != expected_len:
                    continue
                rows.append(row_vals)
            except ValueError:
                continue
    return np.array(rows)


def get_image_columns(
    basename: str, data: np.ndarray
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    num_cols = data.shape[1] if len(data.shape) > 1 else 0
    if basename.startswith("I"):
        if num_cols < 14:
            raise ValueError(f"ADC data has only {num_cols} columns, but old IFCB format requires at least 14 columns.")
        x = data[:, 11].astype(int)
        y = data[:, 12].astype(int)
        startbyte = data[:, 13].astype(int)
    else:
        if num_cols < 18:
            raise ValueError(f"ADC data has only {num_cols} columns, but new IFCB format requires at least 18 columns.")
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

    try:
        x, y, startbyte = get_image_columns(basename, data)
    except Exception as e:
        print(f"Error parsing columns from ADC file: {e}", file=sys.stderr)
        return []

    valid = np.where(x > 0)[0] + 1
    if roi_numbers is None:
        roi_numbers = valid.tolist()
    else:
        roi_numbers = sorted(set(roi_numbers) & set(valid))

    if not roi_numbers:
        print("No valid ROI numbers to extract", file=sys.stderr)
        return []

    targets = []
    if outdir:
        os.makedirs(outdir, exist_ok=True)

    with open(roi_path, "rb") as f:
        for num in roi_numbers:
            idx = num - 1
            expected_size = int(x[idx] * y[idx])
            try:
                f.seek(int(startbyte[idx]))
                img_bytes = f.read(expected_size)
                if len(img_bytes) < expected_size:
                    print(f"Warning: ROI {num} in {basename} has truncated image bytes (expected {expected_size}, got {len(img_bytes)}). Skipping.", file=sys.stderr)
                    continue
                img_array = np.frombuffer(img_bytes, dtype=np.uint8).reshape(
                    int(y[idx]), int(x[idx])
                )
            except Exception as e:
                print(f"Error reading/parsing ROI {num} in {basename}: {e}", file=sys.stderr)
                continue

            pid = f"{basename}_{num:05d}"
            
            if outdir:
                try:
                    Image.fromarray(img_array).save(
                        os.path.join(outdir, f"{pid}.png")
                    )
                    img_to_store = ImagePlaceholder(img_array.shape)
                except Exception as e:
                    print(f"Error saving image {pid}.png to {outdir}: {e}", file=sys.stderr)
                    img_to_store = img_array
            else:
                img_to_store = img_array

            targets.append(
                {
                    "targetNumber": num,
                    "pid": pid,
                    "image": img_to_store,
                }
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

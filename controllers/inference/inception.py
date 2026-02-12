import os
import sys
import argparse
import csv
import zipfile
import json
from pathlib import Path
import numpy as np
from PIL import Image

try:
    import tensorflow as tf
    from tensorflow import keras

    from tensorflow.keras.applications.inception_v3 import preprocess_input, decode_predictions
    from tensorflow.keras.preprocessing import image as keras_image
except ImportError:
    print("Error: TensorFlow is required. Install with: pip install tensorflow")
    sys.exit(1)

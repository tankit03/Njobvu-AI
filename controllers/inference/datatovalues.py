#!/usr/bin/python3
#########################################################
#  OSU Pipeline Tool
#
#  Copyright 2021
#
#  Ashwin Subramanian
#  John S. Koning
#  Christopher M. Sullivan
#
#  Department of Environmental and Molecular Toxicology
#  Department of Botany and Plant Pathology
#  Center for Genome Research and Biocomputing
#  United States Forest Serice
#  Department of Fish and Wildlife
#  Oregon State University
#  Corvallis, OR 97331
#
#  chris@cgrb.oregonstate.edu
#
# This program is not free software; you can not redistribute it and/or
# modify it at all.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
#
#########################################################

#########################################################
# Global Stuff						#
#########################################################
import os
import getopt
import sys
import subprocess
import shutil
import argparse

parser = argparse.ArgumentParser(
    description="Run YOLO predictions with Ultralytics"
)
parser.add_argument("-d", "--data_path",    required=True,
                    help="Path to data folder")
parser.add_argument("-i", "--image_path",
                    required=True, help="Path to images")
parser.add_argument("-n", "--name_path",    required=True,
                    help="Path to classes file")
parser.add_argument("-l", "--log",          required=True,
                    help="Log file path")
parser.add_argument("-f", "--darknet_folder", required=True,
                    help="Darknet/Ultralytics path")
parser.add_argument("-w", "--weight_path",  required=True,
                    help="Model weights file")
parser.add_argument("-D", "--device",       default="cpu",
                    help="Device (cpu, cuda:0, mps, etc.)")
parser.add_argument("-o", "--adv_options",  default="",
                    help="Advanced YOLO options")
parser.add_argument("-t", "--task",         required=True, choices=["detect", "segment", "classify", "pose", "obb"],
                    help="YOLO task to run")
args = parser.parse_args()

data_path = args.data_path
image_path = args.image_path
name_path = args.name_path
log_file = args.log
darknet_path = args.darknet_folder
weight_path = args.weight_path
device = args.device
adv_options = args.adv_options
yolo_task = args.task

#########################################################
# Call command function to run the code			#
#########################################################


def call_command(final_command, debug_mode=""):
    # """Wrapper for subprocess.check_output that implements error handling"""
    try:
        os.system(final_command)

    except subprocess.CalledProcessError as err:  # Return code was non-zero
        print("EXCEPTION!!!!")
        print("Error (Return Code {})".format(err.returncode))
        print("Command: {}".format(err.cmd))
        print("Output: {}".format(err.output))
        sys.exit(1)


#########################################################
# Main body of program with checks for options		#
#########################################################
if data_path == "":
    err = "You need more options to run the tool"
    print(err)

if image_path == "":
    err = "You need more options to run the tool"
    print(err)

print("Ultralytics Version of YOLO Requested:")

# Command to start running ultralytics using the training files
# cmd = darknet_path + " detect predict data=" + name_path + " project=" + data_path + " epochs=" + epochs + " imgsz=" + imgsz + " device=" + device + " model=" + weight_path + " " + adv_options + " 2>&1 > " + log_file
# yolo predict model=/Users/sullichr/Njobvu-AI/Njobvu-AI-tankit03/Njobvu-AI/public/projects/bennyb-ZebFish/training/logs/1735510402147/train/weights/best.pt source='https://speakingofresearch.com/wp-content/uploads/2011/02/zebrafish.jpg' device=mps
cmd = (
    darknet_path
    + f" {yolo_task}"
    + " predict model="
    + weight_path
    + " source="
    + image_path
    + " project="
    + data_path
    + " name=output device="
    + device
    + " "
    + adv_options
    + " 2>&1 > "
    + log_file
)

print(cmd)

# process_code,process_output,process_err,process_mix = call_command(cmd)
call_command(cmd)

destination_dir = data_path
source_dir = data_path + "/output"
files = os.listdir(source_dir)
for file_name in files:
    source_path = os.path.join(source_dir, file_name)
    destination_path = os.path.join(destination_dir, file_name)
    shutil.move(source_path, destination_path)

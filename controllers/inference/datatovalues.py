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
import time
import glob
import os
import getopt
import sys
import subprocess
import unicodedata
import shutil

directory_path = os.path.dirname(os.path.realpath(__file__)) + '/'
data_path = ""
image_path = ""
name_path = ""
weight_path = ""
darknet_path = ""
log_file = ""
device = "cpu"
adv_options = ""
python_path = ""
python_script = ""
percentage = ""
python_options = ""

# Remove 1st argument from the
# list of command line arguments
argumentList = sys.argv[1:]

# Options
options = "d:f:i:n:l:f:w:D:o:h"

# Long options
long_options = ["Data Path", "Images Path", "Name Path", "Log Path", "Darknet Path", "Weight Path", "Device", "Advanced Options", "Help"]

#########################################################
# Help Information - NOT USED					#
#########################################################
def showHelpInfo(err):
	print ("")
	print ("You did not provide all the needed command line arguments")
	print("")
	print ("Example:")
	print("")
	print ("  datatovalues.py -d <data_path> -n <name_path> -h <help>")
	print("")
	print ("  -d\tSet the path of the folder cotaining the images and their text file annotations.")
	print ("  -n\tSet the path of the names file that contains the classes.")
	print ("  -f\tSet the darknet/ultralytics folder path.")
	print ("  -D\tSet the Device value (cpu, gpu#, mps)")
	print ("  -o\tAdvanced YOLO Options (patience=2 seed=3 etc)")
	print ("  -h\tHelp message.")
	print("")
	print("")
	print ("ERROR:")
	print (err)
	print("")
	exit(1)




#########################################################
# Call command function to run the code			#
#########################################################
def call_command(final_command, debug_mode = ""):
	# """Wrapper for subprocess.check_output that implements error handling"""
	try:
		os.system(final_command)

	except subprocess.CalledProcessError as err:  # Return code was non-zero
		print("EXCEPTION!!!!")
		print ('Error (Return Code {})'.format(err.returncode))
		print ('Command: {}'.format(err.cmd))
		print ('Output: {}'.format(err.output))
		sys.exit(1)

#########################################################
# Main body of program with checks for options		#
#########################################################
try:
	# Parsing argument
	arguments, values = getopt.getopt(argumentList, options, long_options)
     
	# checking each argument
	for currentArgument, currentValue in arguments:
		if currentArgument in ("-h", "--Help"):
			err = "Display Help Message"
			showHelpInfo(err)
		elif currentArgument in ("-d", "--data_path"):
			data_path = currentValue
		elif currentArgument in ("-n", "--name_path"):
			name_path = currentValue
		elif currentArgument in ("-i", "--image_path"):
			image_path = currentValue
		elif currentArgument in ("-l", "--log"):
			log_file = currentValue
		elif currentArgument in ("-f", "--darknet_folder"):
			darknet_path = currentValue
		elif currentArgument in ("-w", "--weight_path"):
			weight_path = currentValue
		elif currentArgument in ("-D", "--device"):
			device = currentValue
		elif currentArgument in ("-o", "--adv_options"):
			adv_options = currentValue

except getopt.error as err:
	showHelpInfo(err)

else:
	if data_path == "":
		err = "You need more options to run the tool"
		showHelpInfo(err)

	if image_path == "":
		err = "You need more options to run the tool"
		showHelpInfo(err)

	print("Ultralytics Version of YOLO Requested:")

	#Command to start running ultralytics using the training files
	#cmd = darknet_path + " detect predict data=" + name_path + " project=" + data_path + " epochs=" + epochs + " imgsz=" + imgsz + " device=" + device + " model=" + weight_path + " " + adv_options + " 2>&1 > " + log_file
	# yolo predict model=/Users/sullichr/Njobvu-AI/Njobvu-AI-tankit03/Njobvu-AI/public/projects/bennyb-ZebFish/training/logs/1735510402147/train/weights/best.pt source='https://speakingofresearch.com/wp-content/uploads/2011/02/zebrafish.jpg' device=mps
	cmd = darknet_path + " predict model=" + weight_path + " source=" + image_path + " project=" + data_path + " name=output device=" + device + " " + adv_options + " 2>&1 > " + log_file
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




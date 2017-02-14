#!/usr/bin/python

import os

def run_command(command) : 
	print(command)
	os.system(command)
run_command('git add .')
run_command('git commit -m "test"')
run_command('git push heroku master')
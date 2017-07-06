import os

def kill_process(port_number) : 
	output = os.popen('lsof -i :' + str(port_number)).read()
	try : 
		process_id = output.split('\n')[1].split('   ')[1].split(' ')[1]
		print(os.popen('kill -9 ' + process_id).read())
	except Exception as e: 
		pass

kill_process(5000)
print(os.popen('git pull origin ec2').read())
print(os.popen('npm run start').read())

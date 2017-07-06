ssh -i "lv-create-ec2.pem" ubuntu@ec2-54-218-78-174.us-west-2.compute.amazonaws.com
scp -i "lv-create-ec2.pem" ubuntu@ec2-54-218-78-174.us-west-2.compute.amazonaws.com:~/LVCreate/master/outputFiles/outputabc.mp4 ./
outputabc.mp4

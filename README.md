# Dart Slinger - Node.js

## Current Features

1. Play head-to-head against other users. 

### Currently Supported Games

1. Cricket

## Planned Features

1. Add additional games
	* Around the World
    * x01
2. Add Google and Facebook authentication
3. Use email/text/push requests to accept challenges
4. Tournaments
5. Leagues
6. Performance tracking

## Deploying the Application

#### OpenShift

MongoDB is too large of a cartridge addon to be feasible with free OpenShift gears (the binary takes almost .5 GB), and you will likely run out of disk space. To avoid this, it is best to use [MongoLab](https://mongolab.com/) to get a free .5 GB instance.

Create a free instance with a read/write user. You will use the information for this instance when creating OpenShift deploy for the MONGOLAB_URI.

Create your OpenShift application

	rhc app create dartslinger nodejs-0.10 \
    	--from-code=https://github.com/camuthig/dart_slinger_nodejs.git \
        NODE_ENV=production \
        MONGOLAB_URI='mongodb://<username>:<user_password>@<instance_url>:31271/<database_name'

#### Locally

Install MongoDB locally

Clone the repository

Run NPM install

Run grunt
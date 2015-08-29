SHELL=/bin/bash -o pipefail

RED=\033[0;31m
YELLOW=\033[1;33m
GREEN=\033[0;32m
BLUE=\033[0;34m
PURPLE=\033[0;35m
CYAN=\033[0;36m
BGRED=\033[0;41m
BGYELLOW=\033[1;33m
BGGREEN=\033[0;42m
BGBLUE=\033[0;44m
BGPURPLE=\033[0;45m
BGCYAN=\033[0;46m
NOCOLOR=\033[0m

all: install compile

install: npm-install bower-install

clean: containers-clean

start: serve
serve: install compile containers-start
	echo; \
	echo -e "Now serving on ${BLUE}localhost:8116${NOCOLOR}";

watch: serve
	echo; \
	echo -e "Now handing over to ${BLUE}gulp watch${NOCOLOR}."; \
	echo -e ; \
	node_modules/gulp/bin/gulp.js watch --colors;

stop: containers-stop

require-npm:
	echo -en "Checking for NPM..."; \
	if hash npm 2>/dev/null; \
	then \
		echo -e "${GREEN}OK${NOCOLOR}"; \
	else \
		echo -e "${RED}ERR${NOCOLOR}"; \
		echo -e "    NPM is required to install node packages."; \
		echo -e "    NPM is packaged with NodeJS."; \
		echo -e "    Please install node first."; \
		exit 1; \
	fi;

require-node:
	echo -en "Checking for node..."; \
	if hash node 2>/dev/null; \
	then \
		echo -e "${GREEN}OK${NOCOLOR}"; \
	else \
		echo -e "${RED}ERR${NOCOLOR}"; \
		echo -e "    node is required to run node packages."; \
		echo -e "    Please install node first."; \
		exit 1; \
	fi;

require-docker:
	echo -en "Checking for docker..."; \
	if hash docker 2>/dev/null; \
	then \
		echo -e "${GREEN}OK${NOCOLOR}"; \
	else \
		echo -e "${RED}ERR${NOCOLOR}"; \
		echo -e "    docker is required to containerise build processes."; \
		echo -e "    Please install docker first."; \
		exit 1; \
	fi; \
	echo -en "Checking for docker daemon..."; \
	if docker ps > /dev/null 2>&1; \
	then \
		echo -e "${GREEN}OK${NOCOLOR}"; \
	else \
		echo -e "${RED}ERR${NOCOLOR}"; \
		echo -e "    Cannot run docker commands."; \
		echo -e "    Please check that the docker daemon is running (eg: 'service docker status')"; \
		echo -e "    Please check that your user is in the docker group (eg: 'groups')"; \
		exit  1; \
	fi;

require-docker-compose: require-docker
	echo -en "Checking for docker-compose..."; \
	if hash docker-compose 2>/dev/null; \
	then \
		echo -e "${GREEN}OK${NOCOLOR}"; \
	else \
		echo -e "${RED}ERR${NOCOLOR}"; \
		echo -e "    please install docker-compose. Instructions are here:"; \
		echo -e "    http://docs.docker.com/compose/install/#install-compose"; \
		exit 1; \
	fi;

npm-install: require-npm
	echo -en "Checking for missing node packages..."; \
	MISSING_PACKAGES=0; \
	while read line; \
	do \
		if [ ! -d node_modules/$$line ]; \
		then \
			if [[ $$MISSING_PACKAGES -eq 0 ]]; \
			then \
				echo; \
			fi; \
			MISSING_PACKAGES=$$((MISSING_PACKAGES+1)); \
			echo -e "    Missing $$line"; \
		fi; \
	done < <(./scripts/packages.js); \
	if [[ $$MISSING_PACKAGES -gt 0 ]]; \
	then \
		echo -en "    Triggering install..."; \
		if npm install > /dev/null 2>&1; \
		then \
			echo -e "${GREEN}OK${NOCOLOR}"; \
		else \
			echo -e "${RED}ERR${NOCOLOR}"; \
			echo -e "        Could not install. Try 'npm intall' to debug."; \
			exit 1; \
		fi; \
	else \
		echo -e "${GREEN}OK${NOCOLOR}"; \
	fi;

bower-install: npm-install require-node
	echo -en "Checking for missing bower packages..."; \
	MISSING_PACKAGES=0; \
	while read line; \
	do \
		if [ ! -d bower_components/$$line ]; \
		then \
			if [[ $$MISSING_PACKAGES -eq 0 ]]; \
			then \
				echo; \
			fi; \
			MISSING_PACKAGES=$$((MISSING_PACKAGES+1)); \
			echo -e "    Missing $$line"; \
		fi; \
	done < <(./scripts/bower-packages.js); \
	if [[ $$MISSING_PACKAGES -gt 0 ]]; \
	then \
		echo -en "    Triggering install..."; \
		if node_modules/bower/bin/bower install >/dev/null 2>&1; \
		then \
			echo -e "${GREEN}OK${NOCOLOR}"; \
		else \
			echo -e "${RED}ERR${NOCOLOR}"; \
			echo -e "Packages could not be installed."; \
			echo -e "Debug with 'bower install'"; \
			exit 1; \
		fi; \
	else \
		echo -e "${GREEN}OK${NOCOLOR}"; \
	fi;

test: test-jshint test-policies

test-policies:
	echo -e "Testing with policies..."; \
	while read policyscript; \
	do \
		echo -en "    Checking $$policyscript..."; \
		if ./scripts/policies/$$policyscript 2>&1 | sed "s/^/        /"; \
		then \
			echo -e "${GREEN}OK${NOCOLOR}"; \
		else \
			echo -e "    Checking $$policyscript...${RED}ERR${NOCOLOR}"; \
			echo -e "        $$policyscript failed."; \
			echo -e "        debug with './scripts/policies/$$policyscript'"; \
			exit 1; \
		fi; \
	done < <(ls scripts/policies 2>/dev/null); \
	echo -e "Testing with policies...${GREEN}OK${NOCOLOR}"; \

test-jshint: npm-install require-node
	echo -en "Testing with jshint..."; \
	if node_modules/gulp/bin/gulp.js jshint >/dev/null 2>&1; \
	then \
		echo -e "${GREEN}OK${NOCOLOR}"; \
	else \
		echo -e "${RED}ERR${NOCOLOR}"; \
		echo -e "    jshint failed."; \
		echo -e "    debug with 'gulp jshint'"; \
		exit 1; \
	fi;

compile: npm-install
	echo -e "Compiling with gulp..."; \
	if node_modules/gulp/bin/gulp.js build --colors 2>&1 | sed "s/^/    /"; \
	then \
		echo -e "Compiling with gulp...${GREEN}OK${NOCOLOR}"; \
	else \
		echo -e "Compiling with gulp...${RED}ERR${NOCOLOR}"; \
		echo -e "    Could not compile files. See above."; \
		exit 1; \
	fi;

containers-start: require-docker require-docker-compose
	echo -e "Starting docker containers..."; \
	if docker-compose up -d --no-recreate 2>&1 | sed "s/^/    /"; \
	then \
		echo -e "Starting docker containers...${GREEN}OK${NOCOLOR}"; \
	else \
		echo -e "Starting docker containers...${RED}ERR${NOCOLOR}"; \
		echo -e "    Failed to start docker containers."; \
		echo -e "    Try 'docker-compose up -d --no-recreate' to debug."; \
		exit 1; \
	fi;

containers-stop: require-docker-compose
	echo -e "Stopping docker containers..."; \
	if docker-compose stop 2>&1 | sed "s/^/    /"; \
	then \
		echo -e "Stopping docker containers...${GREEN}OK${NOCOLOR}"; \
	else \
		echo -e "Stopping docker containers...${RED}ERR${NOCOLOR}"; \
		echo -e "    Could not stop the docker containers."; \
		echo -e "    Try 'docker-compose stop' to debug"; \
		exit 1; \
	fi;

containers-clean: require-docker-compose containers-stop
	echo -e "Cleaning up docker containers..."; \
	if docker-compose rm -f 2>&1 | sed "s/^/    /"; \
	then \
		echo -e "Cleaning up docker containers...${GREEN}OK${NOCOLOR}"; \
	else \
		echo -e "Cleaning up docker containers...${RED}ERR${NOCOLOR}"; \
		echo -e "    Could not remove the docker containers."; \
		echo -e "    Try 'docker-compose rm' to debug"; \
		exit 1; \
	fi;

.SILENT:

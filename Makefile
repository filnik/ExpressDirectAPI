BIN=./node_modules/.bin
MOCHA=$(BIN)/mocha
MOCHA_=$(BIN)/_mocha
ISTANBUL=$(BIN)/istanbul

test:
		$(MOCHA)

clean-coverage:
		rm -rf coverage

coverage: clean-coverage
		$(ISTANBUL) cover $(MOCHA_) -- --reporter spec --bail
		@echo
		@echo open coverage/lcov-report/index.html

publish-coverage: coverage
		cat coverage/lcov.info | $(BIN)/coveralls

docs-clean:
		rm -rf docs

docs: docs-clean
		$(BIN)/dox-foundation --source lib --target docs --title expressdirectapi

publish-docs: docs
		git stash
		rm -rf /tmp/expressdirectapi-docs
		cp -R docs /tmp/expressdirectapi-docs
		git checkout gh-pages
		git pull origin gh-pages
		rm -rf docs
		cp -R /tmp/expressdirectapi-docs docs
		git add docs
		git add -u
		git commit -m "Updated docs"
		git push origin
		git checkout master
		git stash apply

.PHONY: test
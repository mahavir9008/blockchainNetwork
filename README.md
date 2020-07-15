# NodeJS samples for Indy SDK

Each sample can be run individually with `node <filename>`.

Some of samples require validators running. They expect the validators to be running either at localhost (127.0.0.1) or at an IP configured in the environment variable `TEST_POOL_IP`. There is a validator pool that can be used which resides at `doc/getting-started/docker-compose.yml`, which runs at IP 10.0.0.2.

## Getting started with the node.js wrapper

Make sure you have libindy installed. Checkout the guides [here](https://github.com/hyperledger/indy-sdk/tree/master/doc).

### On Linux
Export the `LD_LIBRARY_PATH` environment variable to point to the `libindy.so` parent directory, or copy libindy.so to `/usr/lib/libindy.so`.

### On Mac OS
You must have `libindy.dylib` at `/usr/local/lib/libindy.dylib` before running npm install.
    
### On Windows
[Install Libindy](https://github.com/hyperledger/indy-sdk#windows)

Set environment variable `LD_LIBRARY_PATH` to include a path to the lib folder that contains indy.dll.lib

## Run this samples

Inside `samples/nodejs/` :
* `npm install` to install all NodeJS dependencies 
* `npm run ledger:start` to start the ledger Docker container (needed for some samples). You must have docker installed.
* `node main.js` to run all scripts
  * Or `node <filename.js>` to run a specific sample
* `npm run ledger:stop` to stop and remove the ledger Docker container
 
### Troubleshooting

* If you get an error on the npm install, make sure that LD\_LIBRARY\_PATH is defined or that the library is in the correct directory. See above.
* If you get an `CommonInvalidState` indy error, try rebuilding the ledger with the `--no-cache` docker flag.
* If you get an `DidAlreadyExistsError` or `WalletAlreadyExistsError` indy error, try to remove directory `.indy_client` directory in your home.
* If you just can't figure out why you are getting an indy error, try it with `RUST_LOG=INFO` to see the rust logs.

See documentation for the wrapper at [npmjs.com](https://www.npmjs.com/package/indy-sdk#installing).

### Stall Lindy-so file to local machine?

Steps to Validate:
1. apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 68DB5E88
2. sudo add-apt-repository "deb https://repo.sovrin.org/sdk/deb xenial/bionic master"
3. sudo apt-get update
4. sudo apt-get install -y indy-cli
5. indy-cli

Actual Results:
indy-cli is installed and run successfully.

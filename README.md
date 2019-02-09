## This explains how to modify organization names and adding couch db

The purpose of this document is to explain how we can make changes to the balance transfter example in fabric

**---------------------------------**
Purpose: Change the naming convention of entities

peer0.org1.example.com to peer0.seller.com
peer1.org1.example.com to peer1.seller.com

peer0.org2.example.com to peer0.buyer.com
peer1.org2.example.com to peer1.buyer.com

ca.org1.example.com to ca.seller.com
ca.org2.example.com to ca.buyer.com

**---------------------------------**


1. Move to below location
/home/seeraj/blockchain/fabric-samples/balance-transfer/artifacts/channel/cryptogen.yaml
Modify the cryptogen.yaml file based on required naming convention perform the changes

**Changes to 'docker-compose.yaml'**
run below command 
/home/seeraj/blockchain/fabric-samples/bin/cryptogen generate --config=./cryptogen.yaml


peer0.org1.example.com to seller.peer0.com:
	container_name
	CORE_PEER_ID
	CORE_PEER_ADDRESS
	CORE_PEER_GOSSIP_EXTERNALENDPOINT

In other containers:
	CORE_PEER_GOSSIP_BOOTSTRAP
	
**change to 'network-config.yaml'**
peers:
      peer0.org1.example.com to seller.peer0.com:

organizations:
	    peers:
			- peer0.org1.example.com to seller.peer0.com:
Peer:
	peer0.org1.example.com to seller.peer0.com:
		grpcOptions:
		  ssl-target-name-override: peer0.org1.example.com to  seller.peer0.com

2. Generate configtxgen
As we have changed the names, we need to re-create the genesis and channel files, so that the new naming convention can be used by the network while interacting
	Go to below location
	/home/seeraj/blockchain/fabric-samples/balance-transfer/artifacts/channel/configtx.yaml
	AnchorPeers:
		- Host: peer0.org1.example.com to seller.peer0.com
	
	Use below command to consider current path to consider for configtx.yml
	export FABRIC_CFG_PATH=$PWD
	
	reGenerate genesis block
	/home/seeraj/blockchain/fabric-samples/bin/configtxgen -profile TwoOrgsOrdererGenesis -outputBlock ./genesis.block
	
	regenerate channel.tx
	export CHANNEL_NAME=mychannel  && /home/seeraj/blockchain/fabric-samples/bin/configtxgen -profile TwoOrgsChannel -outputCreateChannelTx mychannel.tx -channelID $CHANNEL_NAME

3. Replace all references in the testAPIs.sh files
	peer0.org1.example.com to seller.peer0.com:

4. Using Couch DB
	Needs to create couchdb entery for each of the peer in the 'docker-compose.yaml'
	
	#####################################
	couchdb0:
    container_name: couchdb0
    image: hyperledger/fabric-couchdb
    # Populate the COUCHDB_USER and COUCHDB_PASSWORD to set an admin user and password
    # for CouchDB.  This will prevent CouchDB from operating in an "Admin Party" mode.
    environment:
      - COUCHDB_USER=
      - COUCHDB_PASSWORD=
    ports:
      - 5984:5984
	  
	########################################
	
	update/insert below lines in each peer
	  - CORE_LEDGER_STATE_STATEDATABASE=CouchDB
	  - CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS=couchdb0:5984
      - CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME=
      - CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD=

	update/insert below line in each peer
	depends_on:
      - orderer.example.com
      - couchdb0 #usually this does not exists, you need to enter this
    
##How to use this
Create your custom folder with any name and then copy all these files.

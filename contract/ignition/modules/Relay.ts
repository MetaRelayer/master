// ignition/modules/RelayTestnet.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const RelayTestnetModule = buildModule("RelayTestnetModule", (m) => {
    
    // Replace with your relayer address where you hold MON, you will need to set PrivateKey for the given relayer, address in Relay Service so make sure you only use the address which you control.
	
	const relayerAddress = "0x481632f593a33232675df676466b55E94E686528";  
	    
    // Deploy the MetaTransaction contract with the relayer address
    const metaTransaction = m.contract("RelayTransaction", [relayerAddress]);
    
    return { metaTransaction };
});

module.exports = RelayTestnetModule;
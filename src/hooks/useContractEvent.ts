import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface UseContractEventProps {
  abi: any[];
  eventName: string;
  filter?: Record<string, any>;
}

export function useContractEvent({ abi, eventName, filter }: UseContractEventProps) {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        // Create a JSON-RPC provider (read-only)
        const provider = new ethers.JsonRpcProvider("https://rpc.ankr.com/polygon_amoy");
        
        // Get contract address from environment
        const contractAddress = process.env.REACT_APP_LAND_RECORD_CONTRACT;
        if (!contractAddress) {
          console.warn('REACT_APP_LAND_RECORD_CONTRACT not set');
          return;
        }

        const contract = new ethers.Contract(contractAddress, abi, provider);
        const filterObj = filter ? contract.filters[eventName](...Object.values(filter)) : contract.filters[eventName]();
        const logs = await contract.queryFilter(filterObj);
        
        setEvents(logs.map(log => ({
          ...log,
          returnValues: log.args
        })));
      } catch (error) {
        console.error('Error loading contract events:', error);
        setEvents([]); // Set empty array on error
      }
    };

    loadEvents();
  }, [abi, eventName, filter]);

  return events;
}
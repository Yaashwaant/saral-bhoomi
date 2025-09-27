import { useContractEvent } from '@/hooks/useContractEvent';
import LandRecordABI from '../../../contracts/artifacts/contracts/LandRecord.sol/LandRecord.json';

export default function RecordTimeline({recordHash}:{recordHash:string}){
  const events = useContractEvent({
    abi: LandRecordABI.abi,
    eventName: 'AuthorisedChange',
    filter: {recordId: recordHash}
  });

  return (
    <ul className="text-xs">
      {events.map((e,i)=>{
        const ts = e.returnValues?.ts || e.ts;
        const officer = e.returnValues?.officer || e.officer;
        const field = e.returnValues?.field || e.field;
        const oldVal = e.returnValues?.oldVal || e.oldVal;
        const newVal = e.returnValues?.newVal || e.newVal;
        const txHash = e.transactionHash;
        
        return (
          <li key={i}>
            {new Date(ts*1000).toLocaleString()} –
            Officer {officer} changed <b>{field}</b>
            &nbsp;from "{oldVal}" → "{newVal}"
            {txHash && (
              <a href={`https://polygonscan.com/tx/${txHash}`} target="_blank" rel="noreferrer" className="ml-1 text-blue-600">tx</a>
            )}
          </li>
        );
      })}
    </ul>
  );
}
import { useState } from 'react';

interface Props {
  value: string;
  recordId: string;
  field: string;
  onSuccess: () => void;
}

export default function EditableCell({value, recordId, field, onSuccess}:Props){
  const [edit,setEdit] = useState(false);
  const [txt,setTxt]   = useState(value);

  const save = async () => {
    if (txt===value) { setEdit(false); return; }
    const res = await fetch(`/api/landRecords/${recordId}/authorised`,{
      method:'PUT',
      headers:{
        'Content-Type':'application/json',
        Authorization:`Bearer ${localStorage.token}`
      },
      body:JSON.stringify({field, oldVal:value, newVal:txt})
    });
    if (res.ok){ onSuccess(); setEdit(false); }
  };

  if (!edit) return <td onDoubleClick={()=>setEdit(true)}>{value}</td>;

  return (
    <td className="flex gap-1">
      <input className="input input-sm border" value={txt} onChange={e=>setTxt(e.target.value)} />
      <button className="btn btn-xs btn-primary" onClick={save}>Save</button>
    </td>
  );
}
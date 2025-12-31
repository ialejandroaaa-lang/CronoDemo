const a="http://localhost:5006/api/UnidadMedida",e=async t=>{if(!t)return null;const n=await fetch("".concat(a,"/Planes/").concat(t));return n.ok?await n.json():null};export{e as getPlan};

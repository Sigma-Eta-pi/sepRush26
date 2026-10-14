import { expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({sql:vi.fn()}));
vi.mock('../server/db.js',()=>({sql:mocks.sql}));
vi.mock('../server/process/directory-storage.js',()=>({productionDirectory:async()=>({profiles:[]}),productionDirectoryAsset:async()=>null}));
import {roster} from '../server/routes/process';
it('the existing chapter executive administrator appears as a process master without admitting other external accounts',async()=>{
  mocks.sql.mockImplementation(async(parts:TemplateStringsArray)=>parts.join('').includes('SELECT DISTINCT') ? [
    {id:'chapter',email:'exec@ucsbsep.org',name:'Chapter Executive',role:'admin'},
    {id:'individual',email:'master@ucsb.edu',name:'Individual Master',role:'pledge_master'},
    {id:'external',email:'other@ucsbsep.org',name:'Other',role:'admin'}
  ]:[]);
  const users=await roster();
  expect(users.map(u=>[u.id,u.role])).toEqual([['chapter','master'],['individual','master']]);
});

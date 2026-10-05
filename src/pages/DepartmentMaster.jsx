import MasterCrudPage from '../components/MasterCrudPage'
import DepartmentStatusPanel from '../components/DepartmentStatusPanel'
import { entities } from '../config/entities'

export default function DepartmentMaster() {
  return (
    <div className="dept-master-layout">
      <MasterCrudPage config={entities.department} />
      <DepartmentStatusPanel />
    </div>
  )
}

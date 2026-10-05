import { useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import { employeeStage } from './stageUtils'
import DeptStageEmployeesModal from './DeptStageEmployeesModal'
import EmployeeSkillModal from './EmployeeSkillModal'
import Loader from './Loader'

const STAGES = [
  ['c', 'Competent to train'],
  ['a', 'Authorised'],
  ['u', 'Under training'],
  ['t', 'Training plan']
]

export default function DepartmentStatusPanel() {
  const [departments, setDepartments] = useState([])
  const [employees, setEmployees] = useState([])
  const [assignments, setAssignments] = useState([])
  const [activeDept, setActiveDept] = useState(null)
  const [openStage, setOpenStage] = useState(null)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      api.get('/departments'),
      api.get('/employees'),
      api.get('/assignemployees')
    ])
      .then(([d, e, a]) => {
        if (d.status === 'fulfilled') {
          setDepartments(d.value.data)

          setActiveDept(
            (cur) => cur ?? d.value.data[0]?.deptCode ?? null
          )
        }

        if (e.status === 'fulfilled') {
          setEmployees(e.value.data)
        }

        if (a.status === 'fulfilled') {
          setAssignments(a.value.data)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const byEmp = useMemo(() => {
    const m = {}

    assignments.forEach((a) => {
      ;(m[a.empId] ??= []).push(a)
    })

    return m
  }, [assignments])

  const deptEmployees = employees.filter(
    (e) => e.deptCode === activeDept
  )

  const buckets = useMemo(() => {
    const b = {
      c: [],
      a: [],
      u: [],
      t: []
    }

    deptEmployees.forEach((e) => {
      const stage = employeeStage(
        byEmp[e.empId] || []
      )

      if (stage) {
        b[stage].push(e)
      }
    })

    return b
  }, [deptEmployees, byEmp])

  const activeDeptObj = departments.find(
    (d) => d.deptCode === activeDept
  )

  if (loading) {
    return (
      <div className="card dept-panel">
        <h2>Department Overview</h2>

        <Loader label="Loading departments…" />
      </div>
    )
  }

  if (departments.length === 0) {
    return null
  }

  return (
    <div className="card dept-panel">

      {/* HEADER */}
      <h2>Department Overview</h2>


      {/* DEPARTMENT TABS */}
      <div className="dept-tabs">

        {departments.map((d) => (
          <button
            key={d.deptCode}
            className={
              d.deptCode === activeDept
                ? 'active'
                : ''
            }
            onClick={() => setActiveDept(d.deptCode)}
          >
            {d.deptName}
          </button>
        ))}

      </div>


      {/* C / A / U / T STATUS */}
      <div className="dept-stage-list">

        {STAGES.map(([letter, label]) => (

          <button
            key={letter}
            type="button"

            /*
             * IMPORTANT:
             * This gives each row its stage color.
             */
     className="dept-stage-row"

            onClick={() => setOpenStage(letter)}
          >

            {/* C / A / U / T BOX */}
            <span
              className={`stage-chip stage-${letter}`}
            >
              <strong>
                {letter.toUpperCase()}
              </strong>
            </span>


            {/* LABEL */}
            <span className="dept-stage-label">
              {label}
            </span>


            {/* COUNT */}
            <span className="dept-stage-count">
              {buckets[letter].length}
            </span>

          </button>

        ))}

      </div>


      {/* HINT */}
      <p className="dept-panel-hint">
        Click a status to see who's in it.
      </p>


      {/* STATUS EMPLOYEE POPUP */}
      {openStage && activeDeptObj && (
        <DeptStageEmployeesModal
          department={activeDeptObj}
          stage={openStage}
          employees={buckets[openStage]}
          onClose={() => setOpenStage(null)}

          onPickEmployee={(e) => {
            setOpenStage(null)
            setSelectedEmployee(e)
          }}
        />
      )}


      {/* EMPLOYEE SKILL POPUP */}
      {selectedEmployee && (
        <EmployeeSkillModal
          employee={selectedEmployee}
          assignments={
            byEmp[selectedEmployee.empId] || []
          }
          onClose={() => setSelectedEmployee(null)}
        />
      )}

    </div>
  )
}
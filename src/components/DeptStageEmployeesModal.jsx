import { useEffect } from 'react'

const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')

const STAGE_LABEL = { c: 'Competent to train', a: 'Authorised', u: 'Under training', t: 'Training plan' }

// Small popup: everyone in one department at one stage. Click a name to open
// their full skill breakdown (EmployeeSkillModal), same as from the dashboard.
export default function DeptStageEmployeesModal({ department, stage, employees, onClose, onPickEmployee }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="list-modal" role="dialog" aria-modal="true">
        <div className="emp-modal-banner">
          <img src="/logo.png" alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <span>Skill Matrix</span>
          <button type="button" className="emp-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="list-modal-body">
          <div className="list-modal-head">
            <span className={`stage-chip stage-${stage}`}><strong>{stage.toUpperCase()}</strong></span>
            <div>
              <h3>{STAGE_LABEL[stage]}</h3>
              <p>{department.deptName} · {employees.length} employee{employees.length === 1 ? '' : 's'}</p>
            </div>
          </div>

          {employees.length === 0 ? (
            <p className="skill-row-none">None</p>
          ) : (
            <ul className="list-modal-list">
              {employees.map((e) => (
                <li key={e.empId}>
                  <button type="button" onClick={() => onPickEmployee(e)}>
                    <span className="stamp tiny">
                      {e.photo ? <img src={e.photo} alt="" /> : <span>{initials(e.empName)}</span>}
                    </span>
                    <span className="list-modal-name">{e.empName}</span>
                    <span className="list-modal-id">{e.empId}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

// One config object per master screen. MasterCrudPage renders a
// list + add/edit form from this, so a new master is ~10 lines here
// plus a matching controller on the backend.

export const entities = {
  department: {
    title: 'Department Master',
    endpoint: 'departments',
    idField: 'deptCode',
    columns: [
      { key: 'deptCode', label: 'Dept Code', editableOnCreateOnly: true },
      { key: 'deptName', label: 'Dept Name' }
    ]
  },
  area: {
    title: 'Area Master',
    endpoint: 'areas',
    idField: 'areaCode',
    columns: [
      { key: 'areaCode', label: 'Area Code', editableOnCreateOnly: true },
      { key: 'areaName', label: 'Area Name' }
    ]
  },
  workstation: {
    title: 'Work Station Master',
    endpoint: 'workstations',
    idField: 'workStationCode',
    columns: [
      { key: 'areaCode', label: 'Area', type: 'select', optionsEndpoint: 'areas', optionValue: 'areaCode', optionLabel: 'areaName' },
      { key: 'workStationCode', label: 'Work Station Code', editableOnCreateOnly: true },
      { key: 'workStationName', label: 'Work Station Name' }
    ]
  },
  contractor: {
    title: 'Contractor Master',
    endpoint: 'contractors',
    idField: 'contractorId',
    columns: [
      { key: 'contractorId', label: 'Contractor ID', editableOnCreateOnly: true },
      { key: 'contractorName', label: 'Contractor Name' },
      { key: 'contractorPhoto', label: 'Photo', type: 'photo' },
      { key: 'dateOfJoining', label: 'Date of Joining', type: 'date' }
    ]
  },
  eaton: {
    title: 'Eaton Master',
    endpoint: 'eatons',
    idField: 'eatonId',
    columns: [
      { key: 'eatonId', label: 'Eaton ID', editableOnCreateOnly: true },
      { key: 'eatonName', label: 'Eaton Name' },
      { key: 'photo', label: 'Photo', type: 'photo' },
      { key: 'dateOfJoining', label: 'Date of Joining', type: 'date' }
    ]
  },
  employee: {
    title: 'Employee Master',
    endpoint: 'employees',
    idField: 'empId',
    columns: [
      { key: 'empId', label: 'Emp ID', editableOnCreateOnly: true },
      { key: 'empName', label: 'Emp Name' },
      { key: 'empCategory', label: 'Emp Category', type: 'select', choices: ['Eaton', 'Contractor'] },
      { key: 'photo', label: 'Photo', type: 'photo' },
      { key: 'phoneNo', label: 'Phone No', type: 'phone', maxLength: 10 },
      { key: 'deptCode', label: 'Department', type: 'select', optionsEndpoint: 'departments', optionValue: 'deptCode', optionLabel: 'deptName' }
    ]
  },
  // Has its own page (pages/AssignEmployeeMaster.jsx) because of the T/U/A/C workflow
  assignEmployee: {
    title: 'Assign Employee Master',
    custom: true
  }
}

import axios from 'axios';

const API_URL = `${import.meta.env.VITE_REACT_APP_BACKEND_URL || 'http://localhost:3000'}/lammps`;

const runInputFile = (filePath: string) => {
  return axios.post(`${API_URL}/run-input`, {
    inputFile: filePath
  });
};

const uploadAndRunInputFile = (file: File) => {
  const formData = new FormData();
  formData.append('inputFile', file);
  return axios.post(`${API_URL}/upload-run-input`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

const uploadTrajectoryFile = (file: File) => {
  const formData = new FormData();
  formData.append('trajectoryFile', file);
  return axios.post(`${API_URL}/upload-trajectory`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

const getTrajectoryFile = (fileId: string) => {
  return axios.get(`${API_URL}/trajectory/${fileId}`);
};

const simulationService = {
  runInputFile,
  uploadAndRunInputFile,
  uploadTrajectoryFile,
  getTrajectoryFile,
};

export default simulationService;

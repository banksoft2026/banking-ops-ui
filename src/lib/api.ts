import axios from 'axios';

export const DEFAULT_INSTITUTION_ID = 'INST-001';

const API_BASES = {
  userAdmin: 'http://localhost:8084',
  cbsMaintenance: 'http://localhost:8080',
  accountMaster: 'http://localhost:8082',
  txnPosting: 'http://localhost:8083',
  customerEntity: 'http://localhost:8081',
};

export const userAdminApi = axios.create({ baseURL: API_BASES.userAdmin });
export const cbsApi = axios.create({ baseURL: API_BASES.cbsMaintenance });
export const accountApi = axios.create({ baseURL: API_BASES.accountMaster });
export const txnApi = axios.create({ baseURL: API_BASES.txnPosting });
export const customerApi = axios.create({ baseURL: API_BASES.customerEntity });

const instances = [userAdminApi, cbsApi, accountApi, txnApi, customerApi];

instances.forEach(instance => {
  instance.interceptors.request.use(config => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  instance.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // Clear Zustand auth-storage so RouteGuard redirects properly
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
});

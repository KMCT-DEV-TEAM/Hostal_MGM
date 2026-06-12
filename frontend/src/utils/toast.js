import Swal from 'sweetalert2';

export const showSuccessToast = (title, text = '') => {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    timer: 1500,
    showConfirmButton: false
  });
};

export const showErrorToast = (title, text = '') => {
  return Swal.fire({
    icon: 'error',
    title,
    text
  });
};

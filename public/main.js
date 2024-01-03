document.addEventListener('DOMContentLoaded', () => {
    const userTableBody = document.getElementById('userTableBody');
  
    const loadUsers = () => {
      fetch('https://fantasticfy-project.onrender.com/users')
        .then(response => response.json())
        .then(users => {
          userTableBody.innerHTML = '';
  
          users.forEach((user, index) => {
            const row = `
              <tr>
                <th scope="row">${index + 1}</th>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.username}</td>
              </tr>
            `;
            userTableBody.insertAdjacentHTML('beforeend', row);
          });
        })
        .catch(error => console.error('Error:', error));
    };
  
    loadUsers();
  
    const userForm = document.getElementById('userForm');
    userForm.addEventListener('submit', async event => {
      event.preventDefault();
  
      const formData = new FormData(userForm);
      const userData = {
        name: formData.get('name'),
        username: formData.get('username'),
        email: formData.get('email'),
      };
  
      try {
        const syncResponse = await fetch('https://fantasticfy-project.onrender.com/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });
  
        const syncResult = await syncResponse.json();
  
        console.log(syncResult.message);
  
        if (syncResponse.status === 200) {
          alert('Usuarios sincronizados correctamente');
        }
  
        const addUserResponse = await fetch('https://fantasticfy-project.onrender.com/users', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });
  
        const savedUser = await addUserResponse.json();
  
        loadUsers();
        userForm.reset();
      } catch (error) {
        console.error('Error:', error);
        alert('Hubo un error. Por favor, inténtalo de nuevo.');
      }
    });
  });
  

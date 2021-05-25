window.onload = function() {
    const countOne = document.getElementById('count-one');
    const countTwo = document.getElementById('count-two');

    const btnOne = document.getElementById('btn-one');
    const btnTwo = document.getElementById('btn-two');

    const lockStatus = document.getElementById('lock-display');
    const lockBtn = document.getElementById('lock');
    const unlockBtn = document.getElementById('unlock');

    const updateCountDisplay = async (service) => {
        const { count } = await fetch(`/${service}/count`, {
            method: 'GET'
        }).then(res => res.json());
        
        const eltToUpdate = service === 'one' ? countOne : countTwo;
        eltToUpdate.innerText = count;
    }

    const updateLockDisplay = async () => {
        await fetch(`/lock`, { method: 'GET' })
            .then(res => res.text())
            .then(res => {
                lockStatus.innerText = res.toUpperCase();
            });
    }

    const incrementCount = async (event) => {
        const { id } = event.target;
        const service = id.replace('btn-', '');
        await fetch('/count', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ service }),
            redirect: 'follow'
        });
        await updateCountDisplay(service);
    }

    const toggleLock = async (event) => {
        const { id } = event.target;
        await fetch(`/${id}`, { method: 'POST' })
            .then(res => res.text());

        await updateLockDisplay();
    }

    [btnOne, btnTwo].forEach(btn => btn.addEventListener('click', incrementCount));
    [lockBtn, unlockBtn].forEach(btn => btn.addEventListener('click', toggleLock));

    updateLockDisplay();
    updateCountDisplay('one');
    updateCountDisplay('two');
}
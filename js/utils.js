function getStatusBadge(statusText, type = 'default') {
    let badgeClass = 'badge-pending'; // Default
    let displayStatus = statusText || 'Pendente';

    switch (statusText) {
        case 'Aprovado':
        case 'Autorizado':
            badgeClass = 'badge-approved';
            displayStatus = 'Aprovado';
            break;
        case 'Reprovado':
        case 'Não Autorizado':
            badgeClass = 'badge-rejected';
            displayStatus = 'Reprovado';
            break;
        case 'Pendente':
            badgeClass = 'badge-pending';
            displayStatus = 'Pendente';
            break;
        case 'Em Análise':
            badgeClass = 'badge-pending';
            displayStatus = 'Em Análise';
            break;
        default:
            badgeClass = 'badge-pending';
            displayStatus = 'Pendente';
            break;
    }

    return `<span class="badge ${badgeClass}">${displayStatus}</span>`;
}

// Expor a função globalmente
window.getStatusBadge = getStatusBadge;





export function isViaCepError(data) {
    return 'erro' in data && data.erro === true;
}

import { toast } from 'sonner';

/**
 * Meu helper de 'fetch' personalizado.
 * Ele automaticamente adiciona o token JWT 'Authorization' em todas as chamadas.
 * Também trata erros de rede e respostas não-OK (como 401, 404, 500)
 * e exibe um toast de erro automaticamente.
 */
export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
    // Pego o token que salvei no localStorage durante o login
    const token = localStorage.getItem('authToken');

    // Crio os cabeçalhos da requisição
    const headers = new Headers(options.headers || {});

    // Adiciono o token no cabeçalho 'Authorization'
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    // Defino o Content-Type como JSON por padrão se houver um corpo
    if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    try {
        // Faço a chamada fetch com as opções e os cabeçalhos atualizados
        const response = await fetch(url, {
            ...options,
            headers,
        });

        // Se a resposta não for OK (ex: 404, 500, 401), eu trato o erro
        if (!response.ok) {
            let errorData = { message: `Erro ${response.status}: ${response.statusText}` };
            try {
                // Tento ler a mensagem de erro que o backend enviou no corpo
                const body = await response.json();
                errorData = { message: body.message || errorData.message };
            } catch (e) {
                // Se não houver corpo ou não for JSON, uso o status
            }

            console.error("Erro na API:", errorData.message);
            throw new Error(errorData.message); // Lanço o erro para parar a execução
        }

        return response; // Retorno a resposta original se tudo deu certo
    } catch (error) {
        // Pego erros de rede (ex: backend desligado) ou os erros que lancei acima
        console.error('Falha na requisição:', error);

        // Mostro um toast de erro para o usuário
        const errorMessage = error instanceof Error ? error.message : 'Erro de conexão';
        toast.error(`Erro na API: ${errorMessage}`);

        // Re-lanço o erro para que o componente (ex: `useEffect`) possa parar um 'loading'
        throw error;
    }
};

/**
 * Um atalho que já faz o fetchWithAuth e o .json() da resposta.
 * Se a resposta for um 204 No Content (sem corpo), eu retorno null.
 */
export const fetchJsonWithAuth = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
    const response = await fetchWithAuth(url, options);

    if (response.status === 204) { // No Content
        return null as T;
    }

    // Faço o parse do JSON e retorno
    return await response.json() as T;
};
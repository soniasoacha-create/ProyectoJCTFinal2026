import api from '../api/axiosConfig';

const API_URL = 'facturacion';

const isNotFoundOrForbidden = (error) => {
	const status = error?.response?.status;
	return status === 403 || status === 404;
};

const facturacionService = {
	generarOObtenerFactura: async (idReserva) => {
		const response = await api.post(`${API_URL}/${idReserva}`);
		return response.data;
	},

	obtenerFacturaPorId: async (idFactura) => {
		const response = await api.get(`${API_URL}/${idFactura}`);
		return response.data;
	},

	obtenerFacturaCompleta: async (idReserva) => {
		const response = await api.get(`${API_URL}/completa/${idReserva}`);
		return response.data;
	},

	obtenerFacturasUsuario: async (idUsuario) => {
		const response = await api.get(`${API_URL}/usuario/${idUsuario}`);
		return response.data;
	},

	obtenerTodasFacturas: async () => {
		const response = await api.get(`${API_URL}/todas`);
		return response.data;
	},

	obtenerListadoFacturas: async ({ idUsuario } = {}) => {
		try {
			const response = await api.get(`${API_URL}/todas`);
			return response.data;
		} catch (errorTodas) {
			if (!isNotFoundOrForbidden(errorTodas)) throw errorTodas;
		}

		if (idUsuario) {
			const response = await api.get(`${API_URL}/usuario/${idUsuario}`);
			return response.data;
		}

		return [];
	},

	cambiarEstadoFactura: async (idFactura, estadoFactura) => {
		const response = await api.put(`${API_URL}/${idFactura}/estado`, {
			estado_factura: estadoFactura,
		});
		return response.data;
	},
};

export default facturacionService;

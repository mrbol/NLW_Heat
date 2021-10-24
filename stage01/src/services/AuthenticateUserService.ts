import axios from 'axios'
import prismaClient from '../prisma'
import { sign } from 'jsonwebtoken'

interface IAccessTokenResponse {
	access_token: string
}

interface IUserResponse {
	avatar_url: string
	login: string
	id: number
	name: string
}

class AuthenticateUserService {
	// receber o código via string (code:string)
	async execute(code: string) {
		const url = 'https://github.com/login/oauth/access_token'

		// recuperar o access_token no github (token que o github vai disponibilizar para se ter informações do usuário)
		const { data: accessTokenResponse } =
			await axios.post<IAccessTokenResponse>(url, null, {
				params: {
					client_id: process.env.GITHUB_CLIENT_ID,
					client_secret: process.env.GITHUB_CLIENT_SECRET,
					code,
				},
				headers: {
					Accept: 'application/json',
				},
			})

		// recuperar infos do user no github - se o token for válido, o usuário conseguirá ter acesso as infos
		const response = await axios.get<IUserResponse>(
			'https://api.github.com/user',
			{
				headers: {
					authorization: `Bearer ${accessTokenResponse.access_token}`,
				},
			}
		)

		// verificar se o user existe no banco de dados
		const { login, avatar_url, id, name } = response.data

		let user = await prismaClient.user.findFirst({
			where: {
				github_id: id,
			},
		})

		// Criando usuário se não existir
		if (!user) {
			user = await prismaClient.user.create({
				data: {
					github_id: id,
					login,
					name,
					avatar_url,
				},
			})
		}

		//gerando token
		const token = sign(
			{
				user: {
					name: user.name,
					avatar_url: user.avatar_url,
					id: user.id,
				},
			},
			//segundo parametro é secret utilizada para criar o token e/ou validar o token
			process.env.JWT_SECRET,
			{
				subject: user.id,
				expiresIn: '1d',
			}
		)
		// retornar o token com as infos do user logado.
		return { token, user }
	}
}

export { AuthenticateUserService }

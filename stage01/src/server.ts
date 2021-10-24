import { serverHttp } from './app'

//quem vai subir o servidor é o serverHttp, não mais app
serverHttp.listen(4000, () => console.log(`⚙ Server is on Port 4000 `))

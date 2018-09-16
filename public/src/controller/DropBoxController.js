class DropBoxController {

    constructor(){
        
        // ID DA TAG DO BOTÃO ENVIAR
        this.btnSendFile = document.querySelector('#btn-send-file');
        // ID DA TAG DO INPUT QUE ESTÃO VINCULADA AO CLICK DO BOTÃO
        this.btnOpenInputFile = document.querySelector('#files');
        this.snackModalEl = document.querySelector('#react-snackbar-root');
        
        this.initEvents();
    }

    initEvents(){

        // QUANDO O BOTÃO RECEBER UM CLICK, A TAG INPUT DEVER APLICAR O EVENTO CLICK.
        this.btnSendFile.addEventListener('click', event =>{
            this.btnOpenInputFile.click();
        })

        this.btnOpenInputFile.addEventListener('change', event =>{
            this.sendUploadFile(event.target.files);
            this.snackModalEl.style.display = 'block';
        })
    }

    sendUploadFile(files){

        let promises = [];
        // [...files] = files é uma coleção, logo estamos criando 
        // um array do tamanho da coleção que pode ser imensa
        [...files].forEach( file =>{
            // criando uma promise para efetuar o post de cada arquivo
            promises.push(new Promise((resolve, reject) =>{
                
                let ajax = new XMLHttpRequest();
                ajax.open('POST', '/upload');

                ajax.onload = event => {
                    try{
                        resolve(JSON.parse(ajax.responseText));
                    }catch (e){
                        reject(e);
                    }
                }

                ajax.onerror = event =>{
                    reject(event);
                }

                let formData = new FormData();
                // passando o arquivo no formData, ('nome do campo no post', arquivo)
                formData.append('input-file', file);
                ajax.send(formData);
            }));
        });
        // retorne um array de promessas a serem execultadas, promise.all gerencia todas elas.
        return Promise.all(promises);
    }
}
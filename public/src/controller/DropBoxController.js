class DropBoxController {

    constructor(){
        
        // ID DA TAG DO BOTÃO ENVIAR
        this.btnSendFileEl = document.querySelector('#btn-send-file');
        // ID DA TAG DO INPUT QUE ESTÃO VINCULADA AO CLICK DO BOTÃO
        this.btnOpenInputFileEl = document.querySelector('#files');
        this.snackModalEl = document.querySelector('#react-snackbar-root');
        this.progressBarEl = this.snackModalEl.querySelector('.mc-progress-bar-fg');
        this.nameFileEl = this.snackModalEl.querySelector('.filename');
        this.timeLeftEl = this.snackModalEl.querySelector('.timeleft');

        // this.fileIcons = new Icons();
        this.initEvents();
    }

    initEvents(){

        // QUANDO O BOTÃO RECEBER UM CLICK, A TAG INPUT DEVER APLICAR O EVENTO CLICK.
        this.btnSendFileEl.addEventListener('click', event =>{
            this.btnOpenInputFileEl.click();

        })

        this.btnOpenInputFileEl.addEventListener('change', event =>{
            this.sendUploadFile(event.target.files);
            this.modalShow();
        })
    }

    modalShow(show = true){
        this.snackModalEl.style.display = (show) ? 'block' : 'none';
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

                    this.modalShow(false);

                    try{
                        resolve(JSON.parse(ajax.responseText));
                    }catch (e){
                        reject(e);
                    }
                }

                ajax.onerror = event =>{
                    
                    this.modalShow(false);
                    reject(event);
                }
                
                ajax.upload.onprogress = event =>{
                    this.updateProgressUpload(event, file);
                }

                let formData = new FormData();
                // passando o arquivo no formData, ('nome do campo no post', arquivo)
                formData.append('input-file', file);

                this.startUploadTime = Date.now();

                ajax.send(formData);
            }));
        });
        // retorne um array de promessas a serem execultadas, promise.all gerencia todas elas.
        return Promise.all(promises);
    }

    updateProgressUpload(event, file){

        let timeSpent = Date.now() - this.startUploadTime;

        let loaded = event.loaded;
        let total = event.total;
        let porcent = parseInt((loaded / total) * 100);
        this.progressBarEl.style.width = `${porcent}%`;

        let timeLeft = ((100 - porcent) * timeSpent)/porcent;

        this.nameFileEl.innerHTML = file.name;
        this.timeLeftEl.innerHTML = this.formatEstimatedTimeToUpload(timeLeft);

    }

    formatEstimatedTimeToUpload(duration){
        
        let file = new Object();
        file.type = 'tes';
        let a = new Icons();
        a.getFileIcons(file);
        // this.fileIcons.getFileIcons(file);

        let seconds = parseInt( (duration / 1000) % 60);
        let minutes = parseInt( (duration / (1000 * 60)) % 60);
        let hours = parseInt( (duration / (1000 * 60 * 60)) % 24);

        if(hours > 0)
            return `${hours} horas, ${minutes} minutos e ${secondos} segundos`;
        
        if(minutes > 0)
            return `${minutes} minutes e ${seconds} segundos`;

        if(seconds > 0)
            return ` ${seconds} segundos`
      
        return `0 segundos`;
    }

    // TODO: ************************************************* ACESSAR INSTANCIA DOS ICONES
    insertIconToUploadFile(){
        return `
            ${ this.fileIcons.getFileIcons(file)}
            <div class="name text-center">${file.name}</div>
        `
    }
}
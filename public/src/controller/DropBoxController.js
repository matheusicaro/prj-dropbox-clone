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
        this.listFilesEl = document.querySelector('#list-of-files-and-directories')
        this.icons = new Icons();

        this.connectFirebase();
        this.initEvents();
        this.readFilesDatabase();
    }

    connectFirebase(){
        // Initialize Firebase
        var config = {
            apiKey: "AIzaSyD7fP80vUXcqqDM0f4WVktrUBf0Gp5q7uc",
            authDomain: "prj-dropbox-clone.firebaseapp.com",
            databaseURL: "https://prj-dropbox-clone.firebaseio.com",
            projectId: "prj-dropbox-clone",
            storageBucket: "prj-dropbox-clone.appspot.com",
            messagingSenderId: "903276101202"
        };
        firebase.initializeApp(config);
    }

    // buscar referencia da coleção no banco, referencia para cruds na collection.
    getDatabaseReference(){
        return firebase.database().ref('files');
    }

    readFilesDatabase(){
        
        // on('value', snapshot()) - metodo que fica aguardando um evento no DB
        // e o snapshot é uma fotografia do DB quando ocorrer um evento, o retorno de on(). 
        this.getDatabaseReference().on('value', collectionInDB =>{
            
            this.listFilesEl.innerHTML = ''; // clear previous data
            
            collectionInDB.forEach(document =>{
                let key = document.key;
                let data = document.val();
                this.listFilesEl.appendChild(this.insertIconToFile(data, key))
            })
        })
    }


    initEvents(){

        // QUANDO O BOTÃO RECEBER UM CLICK, A TAG INPUT DEVER APLICAR O EVENTO CLICK.
        this.btnSendFileEl.addEventListener('click', event =>{
            this.btnOpenInputFileEl.click();

        })

        this.btnOpenInputFileEl.addEventListener('change', event =>{

            this.btnSendFileEl.disabled = true;

            this.sendUploadFile(event.target.files).then(responses =>{
                responses.forEach(response =>{
                    this.getDatabaseReference().push().set(response.files['input-file']);
                })
                this.uploadComplete();

            }).catch(err =>{
                this.uploadComplete();
                console.log("error: ", err)
            })
            this.modalShow();
        })
    }

    uploadComplete(){
        this.modalShow(false);
        this.btnOpenInputFileEl.value = '';
        this.btnSendFileEl.disabled = false;
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

                    try{
                        resolve(JSON.parse(ajax.responseText));
                    }catch (e){
                        reject(e);
                    }
                }

                ajax.onerror = event =>{
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
    insertIconToFile(file, key){
        
    // montar <li> para inserir busca de icones em getFileIcon() 
        let li = document.createElement('li');
        // HTMLElement.dataset 
        li.dataset.key = key;
        li.innerHTML = `
                        ${ this.icons.getFileIcon(file)}
                        <div class="name text-center">${file.name}</div>
                    `
        return li;
    }
}
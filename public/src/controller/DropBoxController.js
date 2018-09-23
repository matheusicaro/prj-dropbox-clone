class DropBoxController {

    constructor(){
        
        // ID DA TAG DO BOTÃO ENVIAR
        this.btnSendFileEl = document.querySelector('#btn-send-file');
        this.btnOpenInputFileEl = document.querySelector('#files');
        this.btnDeleteEl = document.querySelector('#btn-delete');
        this.btnRenameEl = document.querySelector('#btn-rename');
        this.btnNewFolderEl = document.querySelector('#btn-new-folder');

        this.snackModalEl = document.querySelector('#react-snackbar-root');
        this.progressBarEl = this.snackModalEl.querySelector('.mc-progress-bar-fg');
        this.nameFileEl = this.snackModalEl.querySelector('.filename');
        this.timeLeftEl = this.snackModalEl.querySelector('.timeleft');
        this.listFilesEl = document.querySelector('#list-of-files-and-directories')
        
        this.iconsType = new Icons();

        this.onSelectionChange = new Event('selectionChange');

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

        // event para quando for clicado em deletar arquivos
        this.btnDeleteEl.addEventListener('click', e =>{

            this.deleteFileDataBase().then(responses => {
                
                responses.forEach( response =>{
                    let fileKey = response.fields.key;
                    if(fileKey){
                        this.getDatabaseReference().child(fileKey).remove();
                    }
                })

            }).catch(err =>{
                console.log(err);
            })
        })


        // evento quando clicar no botão 'rename'
        this.btnRenameEl.addEventListener('click', event =>{

            let firstFileSelected = this.getSelectedFiles()[0];
            let file = JSON.parse(firstFileSelected.dataset.file);

            // abra um pop-up para renomear o arquivo
            let newName = prompt("Renomear o arquivo", file.name)

            if(newName){
                file.name = newName;
                let key = firstFileSelected.dataset.key;
                // no banco, procure um filho(child) da referencia do banco, e substitua o arquivo.
                console.log(file)
                this.getDatabaseReference().child(key).set(file);
            }
        })

        this.listFilesEl.addEventListener('selectionChange', e =>{
            
            // para a quantidade de arquivos selecionados, esconda ou mostre opções na view
            switch(this.getSelectedFiles().length){

                // esconde os botões caso não tenha nenhum arquivo selecionado
                case 0:
                    this.btnDeleteEl.style.display = 'none';
                    this.btnRenameEl.style.display = 'none';
                break;
                
                // mostre os botões caso tenha um arquivo selecionado
                case 1:
                    this.btnDeleteEl.style.display = 'block';
                    this.btnRenameEl.style.display = 'block';
                break;
                
                // para varios arquivos selecionados, esconda ou demonstre os botões
                default:
                    this.btnDeleteEl.style.display = 'block';
                    this.btnRenameEl.style.display = 'none';

            }
        })

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

    deleteFileDataBase(){

        let promises = [];
        this.getSelectedFiles().forEach(element => {

            let file = JSON.parse(element.dataset.file);
            let key = element.dataset.key;
            let formData = new FormData();

            formData.append('path', file.path);
            formData.append('key', key);
            // PARA CADA PROMESSA DE UM ARQUIVO, REALIZE UM DELETE NO SERVIDOR.
            promises.push(
                    this.ajax( '/file', 'DELETE', formData, 
                        () =>{ this.updateProgressUpload(event, file) }, 
                        () =>{ this.startUploadTime = Date.now() }
                    )
            );
        })
        return Promise.all(promises);
    }

    getSelectedFiles(){
        return this.listFilesEl.querySelectorAll('.selected')
    }

    uploadComplete(){
        this.modalShow(false);
        this.btnOpenInputFileEl.value = '';
        this.btnSendFileEl.disabled = false;
    }

    modalShow(show = true){
        this.snackModalEl.style.display = (show) ? 'block' : 'none';
    }


    ajax( url, method='GET', formData=new FormData(), onprogress=function(){}, onloadstart=function(){} ){

        return new Promise((resolve, reject) =>{

            let ajax = new XMLHttpRequest();
            ajax.open(method, url);

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
            
            ajax.upload.onprogress = onprogress;
            onloadstart();

            this.startUploadTime = Date.now();
            ajax.send(formData);
        });
    }



    sendUploadFile(files){

        let promises = [];
        // [...files] = files é uma coleção, logo estamos criando 
        // um array do tamanho da coleção que pode ser imensa
        [...files].forEach( file =>{
           
           
           
            let formData = new FormData();
            // passando o arquivo no formData, ('nome do campo no post', arquivo)
            formData.append('input-file', file);
           
            // criando uma promise para efetuar o post de cada arquivo
            promises.push(
                this.ajax( '/upload', 'POST', formData, 
                    () =>{ this.updateProgressUpload(event, file) }, 
                    () =>{ this.startUploadTime = Date.now() }
                )
            )
        });

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
        
    // montar <iconInTagLi> para inserir busca de icones em getFileIcon() 
        let iconInTagLi = document.createElement('li');
        // HTMLElement.dataset 
        iconInTagLi.dataset.key = key;
        iconInTagLi.dataset.file = JSON.stringify(file);

        iconInTagLi.innerHTML = `
                        ${ this.iconsType.getFileIconByExtension(file)}
                        <div class="name text-center">${file.name}</div>
                    `
        // adicionar evento antes de retornar o (iconInTagLi - icone do arquivo).
        this.initEventForFileSelection(iconInTagLi);
        
        return iconInTagLi;
    }

    // "currentFileSelected" == TAG html <li>, que representa icone do arquivo na view.
    initEventForFileSelection(currentFileSelected){

        currentFileSelected.addEventListener('click', event =>{

            // se o shift estiver selecionado, entre
            if(event.shiftKey){
                // pegue o primeiro arquivo selecionado pelo shift
                let fileSelectedWithShift = this.listFilesEl.querySelector('.selected');
                
                if(fileSelectedWithShift){
                    let indexStart;
                    let indexEnd;
                    
                    // selecione a TAG-lu pai que contem uma lista de arquivos, e pegue o index do proximo arquivo selecionado
                    let listFiles = currentFileSelected.parentElement.childNodes;
                   
                    // pegue o index do segundo arquivo selecionado
                    listFiles.forEach((file, index) =>{
                        if(fileSelectedWithShift === file) indexStart = index;
                        if(currentFileSelected === file) indexEnd = index;
                    });

                    let limitForSelectionFiles = [indexStart, indexEnd].sort();
                    
                    // dentre o intervalo da lista de arquivos, aplique o efeito de seleção para todos entre o intervalo definido, limitForSelectionFiles
                    listFiles.forEach((element, index) =>{
                        if( index >= limitForSelectionFiles[0] && index <= limitForSelectionFiles[1] )
                            this.addCssClassToElement(element, 'selected');
                    })
                    
                    // dispara um evento quando selecionar um arquivo
                    this.listFilesEl.dispatchEvent(this.onSelectionChange);
                    return true;
                }

            }

            // se o ctrl não estiver selecionado, remova o efeito css do ultimo arquivo selecionado.
            if( !event.ctrlKey ){
                // remova a classe CSS que dar o efeito de seleção no arquivo.
                this.listFilesEl.querySelectorAll('li.selected').forEach(element =>{
                    this.removeCssClassToElement(element, 'selected');
                })
            }
            
            // aplicando efeito de seleção via classe CSS quando ocorrer um click no arquivo 
            this.addCssClassToElement(currentFileSelected, 'selected');

            // dispara um evento quando selecionar um arquivo
            this.listFilesEl.dispatchEvent(this.onSelectionChange);
        })
    }

    addCssClassToElement(element, cssClass){
        return element.classList.add(cssClass);
    }

    removeCssClassToElement(element, cssClass){
        return element.classList.remove(cssClass);
    }
    
}
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
        this.urlFile = [];
        this.currentFolder = ['Meu DropBox']
        this.linkFolderPath = document.querySelector('#browse-location');

        this.connectFirebase();
        this.initEvents();
        this.openFolder()
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
    getDatabaseReference(path){
        // se path não é uma nova pasta, retorne a referencia da pasta atual.
        if( !path ) path = this.currentFolder.join('/')

        return firebase.database().ref(path);
    }

    readFilesDatabase(){
        
        // a ultima pasta é a pasta atual antes antes de acessar a proxima pasta
        this.lastFolder = this.currentFolder.join('/');
        
        // on('value', snapshot()) - metodo que fica aguardando um evento no DB
        // e o snapshot é uma fotografia do DB quando ocorrer um evento, o retorno de on(). 
        this.getDatabaseReference().on('value', collectionInDB =>{
            
            this.listFilesEl.innerHTML = ''; // clear previous data
            
            collectionInDB.forEach(document =>{
                let key = document.key;
                let data = document.val();
                // Se o cumento tem existe um type, extensao, renderiza na tela.
                if(data.type)
                    this.listFilesEl.appendChild(this.insertIconToFile(data, key))
            })
        })
    }

    initEvents(){

        // event quando para o botão criar pasta
        this.btnNewFolderEl.addEventListener('click', element =>{
            // recebe o nome da pasta e cria sua referencia no Firebase
            let folderName = prompt('Nome da nova pasta:');
            if(folderName){
                this.getDatabaseReference().push().set({
                    name: folderName, 
                    type: 'folder',
                    path: this.currentFolder.join('/')
                })
            }
        })


        // event para quando for clicado em deletar arquivos
        this.btnDeleteEl.addEventListener('click', e =>{

            this.deleteFileDataBase().then(responses => {
                
                responses.forEach( response =>{
                    console.log(response)
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
               
               // após upload dos arquivos, grave as informações como referencia no Firebase
               responses.forEach(response =>{

                    let url; 
                    this.urlFile.forEach((element) =>{
                        if(element.name === response.name){
                           url = element.url;
                        }
                    })

                    let index =this.urlFile.indexOf(response.name);
                    console.log(response.name, " : ", url)
                    this.getDatabaseReference().push().set({
                        name: response.name,
                        type: response.contentType,
                        path: url,
                        size: response.size
                    });
                })
                this.uploadComplete();

            }).catch(err =>{
                this.uploadComplete();
                console.log("error: ", err)
            })
            this.urlFile = [];
            this.modalShow();
        })
    }

    deleteFileDataBase(){

        let promises = [];
        this.getSelectedFiles().forEach(element => {

            let file = JSON.parse(element.dataset.file);
            let key = element.dataset.key;
          
            // PARA CADA PROMESSA DE UM ARQUIVO, REALIZE UM DELETE NO SERVIDOR.
            promises.push( new Promise ((resolve,reject) =>{
                
                // SE for uma pasta apague-a, SE N SE for um arquivo, apague.
                if (file.type === 'folder'){

                    let reference = this.currentFolder.join('/');
                    // delete a pasta e retorne a o campo com a key do objeto removido.
                    this.removeFolder(reference, file.name).then(() =>{
                        
                        resolve({ fields: { key: key }})
                    
                    })
                
                }else if (file.type){
                    
                    let reference = this.currentFolder.join('/');
                    // delete o arquivo e retorne a o campo com a key do objeto removido, se não ocorrer, rejeita o erro.
                    this.removeFileStorage(reference, file.name).then(() =>{
                        
                        resolve({ fields: { key: key }})
                    
                    })
                }

            }));
        })

        return Promise.all(promises);
    }

    removeFolder(reference, name){

        return new Promise( (resolve, reject) =>{

            // pegue a referencia da pasta, o caminho
            let folderReference = this.getDatabaseReference(reference + '/' + name);
            // acesse a pasta e escute os eventos, no primeiro evento que foi encontrado, me retorne 'files'
            folderReference.on('value', files =>{

                console.log(folderReference)
                // pare de ouvir eventos da pasta atual
                folderReference.off('value');

                // Para cada item na pasta, percorra, se encontrar arquivo apague, se encontrar pasta, entre e percorrar.
                files.forEach(item =>{

                    let file = item.val();
                    file.key = item.key;
                    console.log("file :", file)

                    if(file.type === 'folder'){
                        
                        let ref = (reference + '/' + name); 
                        
                        this.removeFolder(ref, file.name).then( ()=> { 
                            resolve({ 
                                filds: { key: file.key }
                            })
                        }).catch(err =>{
                            reject(err)
                        })

                    }else if (data.type){

                        let ref = (reference + '/' + name);
                        this.removeFileStorage(ref, file.name).then( ()=> { 
                            resolve({ 
                                filds: { key: file.key }
                            })
                        }).catch(err =>{
                            reject(err)
                        })
                    }
                })

                // apague a pasta atual
                folderReference.remove();

            })
        });

    }

    removeFileStorage(reference, name){

        let fileReference = firebase.storage().ref(reference).child(name);
        return fileReference.delete();
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
        this.urlFile = [];
        let promises = [];
        // [...files] = files é uma coleção, logo estamos criando 
        // um array do tamanho da coleção que pode ser imensa
        [...files].forEach( file =>{
           let url = "";
            promises.push(new Promise((resolve, reject) =>{
                // referencia do arquivo no storage que recebe o caminho do file e o chiled que é para criar no banco. getDonwloadURL() retorna url do arquivo
                let fileRef = firebase.storage().ref(this.currentFolder.join('/')).child(file.name);
                // uploadTask  é uma referencia que consegue manipular o donwload do arquivo, como eventos de bits no download
                let uploadTask  = fileRef.put(file);
                uploadTask .on('state_changed', uploadProgress =>{

                    this.updateProgressUpload({
                        loaded: uploadProgress.bytesTransferred,
                        total: uploadProgress.totalBytes
                    }, file);

                }, error =>{
                    console.log(error);
                    resolve();
                
                }, () =>{   // apóes o upload ser realizado, é retornado uma promise com as informacoes do file
                    fileRef.getMetadata().then(metadata =>{
                        resolve(metadata);

                    }).catch(err =>{
                        reject(err)
                    })
                });
                // necessario vincular um MAP entre 'nome' e 'url' do arquivo por causa da referencia do Storage
                fileRef.getDownloadURL().then(url => { 
                    let object = new Object();
                    object.name = file.name;
                    object.url = url;
                    this.urlFile.push(object) 
                });

            }));
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

        // add event para quando ocorrer um double click no arquivo
        currentFileSelected.addEventListener('dblclick', event =>{

            let file = JSON.parse(currentFileSelected.dataset.file);
            switch(file.type){

                case 'folder':
                    this.currentFolder.push(file.name); // empura uma referencia da pasta atual para o vetor de pastas.
                    this.openFolder();
                break;

                default:
                    window.open('/file?path=' + file.path); // abra o arquivo
                break;
            }
        })

        // add event para quando ocorrer um click no arquivo
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

    openFolder(){
        //Se existe existe uma pasta anterior, pegue a referencia da ultima pasta e apague o evento que fica escultando a ultima pasta
        if(this.lastFolder) this.getDatabaseReference(this.lastFolder).off('value');
        
        this.renderFolderLink();
        this.readFilesDatabase();
    }

    renderFolderLink(){

        let navFilePath = document.createElement('nav');
        let path = [];

        for(let index=0; index < this.currentFolder.length; index++){

            let folderName = this.currentFolder[index];
            path.push(folderName);

            let span = document.createElement('span');
            let lastFolder = index + 1;

            if( lastFolder === this.currentFolder.length )
                span.innerHTML = folderName;

            else{
                span.className = 'breadcrumb-segment__wrapper';
                span.innerHTML = `
                    <span class="ue-effect-container uee-BreadCrumbSegment-link-0">
                        <a href="#" data-path="${path.join('/')}"  class="breadcrumb-segment">${folderName}</a>
                    </span>
                    <svg width="24" height="24" viewBox="0 0 24 24" class="mc-icon-template-stateless" style="top: 4px; position: relative;">
                        <title>arrow-right</title>
                        <path d="M10.414 7.05l4.95 4.95-4.95 4.95L9 15.534 12.536 12 9 8.464z" fill="#637282"
                            fill-rule="evenodd"></path>
                    </svg>
                `;
            }
            navFilePath.appendChild(span);
        }

        this.linkFolderPath.innerHTML = navFilePath.innerHTML;

        this.linkFolderPath.querySelectorAll('a').forEach(tag_a =>{
            tag_a.addEventListener('click', event =>{
                event.preventDefault(); // não insira o '#' no caminho
                // a pasta atual agora é o caminho da tag_a
                
                this.currentFolder = tag_a.dataset.path.split('/');
                console.log(this.currentFolder);
                // agora abra a pasta atual
                this.openFolder();
            });
        });

    }

    addCssClassToElement(element, cssClass){
        return element.classList.add(cssClass);
    }

    removeCssClassToElement(element, cssClass){
        return element.classList.remove(cssClass);
    }
    
}
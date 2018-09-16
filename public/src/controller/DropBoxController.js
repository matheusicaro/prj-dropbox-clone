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

            console.log(event.target.files);
            this.snackModalEl.style.display = 'block';
        })
    }
}
    //Start Editor
    var editor = ace.edit("code-editor");
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/javascript");
    
    //Listen for Drag & Drop
    var catchDroppedFiles = function (editor) {
        "use strict";
        function catchAndDoNothing(e) {
            e.stopPropagation();
            e.preventDefault();
        }
        
        function drop (e) {
            catchAndDoNothing(e);
            var file = e.dataTransfer.files[0];
            if (file) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    var contents = e.target.result;
                    editor.session.setValue(contents);
                };
                reader.readAsText(file);
            } else {
                throw new Error("Failed to load file");
            }
            
            function dragAndDropHook() {
                editor.container.addEventListener("dragenter", catchAndDoNothing, false);
                editor.container.addEventListener("dragover", catchAndDoNothing, false);
                editor.container.addEventListener("drop", drop, false);
            }
            
            dragAndDropHook();
            
            }
    }
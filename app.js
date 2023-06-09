/*TODO:
    Spells
    Allow import XML to populate form, for edit / save-and-resume

    Persisted storage??
    Browser storage at a minimum, but also Drive Storage options?
*/
const $ = Sizzle;
var itemDescription = new Quill('#ItemForm_description_editor', {
    modules: { toolbar: '#ItemForm_description_toolbar' },
    placeholder: 'Full description of the item and its function',
    theme: 'snow'
});
var npcDescription = new Quill('#NpcForm_description_editor', {
    modules: { toolbar: '#NpcForm_description_toolbar' },
    placeholder: 'Fluff text - description, lore, behaviour, etc.',
    theme: 'snow'
});
var spellDescription = new Quill('#SpellForm_description_editor', {
    modules: { toolbar: '#SpellForm_description_toolbar' },
    placeholder: 'Spell description',
    theme: 'snow'
});

$('#select_recordtype')[0].addEventListener('change', e => {
    let form = e.target.value;
    $('form').forEach(f => {
        f.hidden = true;
        f.reset();
    });
    $(`#${form}Form`)[0].hidden = false;
});

$('form').forEach(form => {
    form.addEventListener('submit', (e) => {
        e.preventDefault();  
        //update quill hidden
        for (let quillContainer of $('.quill', e.target)){
            let valueInput = $(`#${quillContainer.id}_value`)[0];
            let editor = $('.ql-editor', quillContainer)[0];
            
            valueInput.value = sanitizeQuill(editor.innerHTML);
        }
        
        processForm(e.target);
    })
});

function sanitizeQuill(str){
    return str.replace("<br>", "<br />");
}

function processForm(form) {
    let formFields = getFormFields(form);
    console.log(formFields);
    let compactJs = convertBasicFieldsToCompactJs(formFields.filter(f => f.type !== 'formattedtext'));
    console.log(compactJs);
    let xml = js2xml(compactJs, { compact: true });
    xml = appendFormattedTextXml(xml, formFields.filter(f => f.type === 'formattedtext'));
    xml = wrapXml(xml, form.getAttribute("data-record-type"))
    console.log(xml);

    saveXmlFile(xml, formFields.find(f => f.key === "name").value);
}

function getFormFields(form){
    let formData = new FormData(form);

    let fields = [];
    for (let [key, value] of formData.entries()) {
        console.log(key, value);
    
        let input = $(`[name=${key}`, form)[0];
    
        let type = "string"
        if (input.hasAttribute('data-type'))
            type = input.getAttribute('data-type');
        else if (input.hasAttribute("type"))
            type = input.getAttribute("type");
        else if (input.tagName === 'TEXTAREA')
            type = 'formattedtext';
    
        fields.push({ key, value, type });
    }

    return fields;
}

function convertBasicFieldsToCompactJs(basicFields) {
    let obj = {}
    for (let field of basicFields) {
        obj[field.key] = {
            "_attributes": { "type": field.type },
            "_text": field.value
        };
    }

    return obj;
}

function appendFormattedTextXml(xml, formattedFields){
    for (let field of formattedFields) {
        let fieldXml = `<${field.key} type="formattedtext">${field.value}</${field.key}>`;
        xml += fieldXml;
    }

    return xml;
}

function wrapXml(xml, recordType){
    return `<root><${recordType}>${xml}</${recordType}></root>`
}

function saveXmlFile(xml, name) {
    download(xml, name + '.xml', 'text/xml');
}

// Function to download data to a file
function download(data, filename, type) {
    var file = new Blob([data], { type: type });
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}

//debug functions
function fillForms() {
    for (let input of $('form input, form textarea')) {
        if (input.type === "number")
            input.value = input.placeholder.length;
        else
            input.value = input.placeholder;
    }

    itemDescription.setText("Item Description");
    npcDescription.setText("Npc Description");
    spellDescription.setText("Spell Description");
}

//debug
//fillForms();
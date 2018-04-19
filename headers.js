//console.log(document.getElementById('header-container').clientHeight);

function settingsCall() {
    var offsetHeight = document.getElementById('header-container').clientHeight;
    //console.log(offsetHeight);
    if (document.getElementById('settings').offsetTop == 0) {
        document.getElementById('settings').classList.remove('leave');
        document.getElementById('settings').classList.add('enter');
    } else {
        document.getElementById('settings').classList.remove('enter');
        document.getElementById('settings').classList.add('leave');
    }
    if (document.getElementById('links').offsetTop != 0) {
        document.getElementById('links').classList.add('leave');
        document.getElementById('links').classList.remove('enter');
    }
}

function linksCall() {
    if (document.getElementById('links').offsetTop == 0) {
        document.getElementById('links').classList.remove('leave');
        document.getElementById('links').classList.add('enter');
    } else {
        document.getElementById('links').classList.remove('enter');
        document.getElementById('links').classList.add('leave');
    }
    if (document.getElementById('settings').offsetTop != 0) {
        document.getElementById('settings').classList.add('leave');
        document.getElementById('settings').classList.remove('enter');
    }
}
// Aithos onboarding: creates the client folder structure in Google Drive and shares it.
// Deploy as a Web app under the Google account that owns "Aithos Marketing Clients" (max@maxvonk.nl):
//   Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone.
// The Cloudflare Worker calls this URL with { key, name, email }.

var KEY = 'PLAK_HIER_DE_KEY_UIT_KEY.txt';
var PARENT_FOLDER_ID = '1AXz4PecbjAn5nn-kZFzdPXcLACEwFt0J'; // Aithos Marketing Clients

function doPost(e) {
  var out = ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON);
  try {
    var body = JSON.parse(e.postData.contents || '{}');
    if (!body.key || body.key !== KEY) return out.setContent(JSON.stringify({ ok: false, error: 'unauthorized' }));
    var name = String(body.name || '').trim();
    var email = String(body.email || '').trim();
    if (!name || !email) return out.setContent(JSON.stringify({ ok: false, error: 'name_and_email_required' }));

    var parent = DriveApp.getFolderById(PARENT_FOLDER_ID);
    var main = parent.createFolder(name + ' x Aithos Marketing');
    main.createFolder("Brand Documents & SOP's");
    main.createFolder('Raw Footage');
    main.createFolder('Currently Doing');
    main.createFolder('Completed');
    var ideation = main.createFolder('Ideation');
    ideation.createFolder('Short Form');
    ideation.createFolder('Long Form');
    ideation.createFolder('Story Sequences');
    main.addEditor(email);

    return out.setContent(JSON.stringify({ ok: true, folderId: main.getId(), folderUrl: main.getUrl() }));
  } catch (err) {
    return out.setContent(JSON.stringify({ ok: false, error: String(err && err.message || err) }));
  }
}

// Run this once from the editor to grant the Drive permission and check the parent folder.
function testSetup() {
  var parent = DriveApp.getFolderById(PARENT_FOLDER_ID);
  Logger.log('Parent folder OK: ' + parent.getName());
}

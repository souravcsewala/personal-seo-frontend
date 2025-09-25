export const TINYMCE_API_KEY = "5bmtvucg1cmq3nhmi9od4aecrt03jwrhg8y71puxkkfdrm9k";

export const tinymceConfig = (height = 350) => ({
  height,
  resize: true,
  menubar: "file edit view insert format tools table help",
  toolbar_mode: "wrap",
  plugins: [
    "advlist",
    "lists",
    "link",
    "image",
    "preview",
    "anchor",
    "searchreplace",
    "visualblocks",
    "code",
    "fullscreen",
    "insertdatetime",
    "media",
    "table",
    "help",
    "wordcount",
    "emoticons",
  ],
  toolbar: [
    "fontselect fontsizeselect | formatselect styleselect",
    "undo redo restoredraft | bold italic underline strikethrough | subscript superscript | forecolor backcolor",
    "alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | blockquote hr charmap emoticons",
    "removeformat | link unlink anchor image media table ltr rtl",
    "searchreplace code fullscreen preview wordcount",
  ].join(" | "),
  branding: false,
});



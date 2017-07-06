Parse.Cloud.define('test', (request, response) => {
    response.success("Hello" +request.params.name);
});
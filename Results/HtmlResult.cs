namespace ViteraBackend.Results;

public class HtmlResult : IResult
{
    private readonly string _html;
    public HtmlResult(string html) => _html = html;
    public async Task ExecuteAsync(HttpContext context)
    {
        context.Response.ContentType = "text/html; charset=utf-8";
        await context.Response.WriteAsync(_html);
    }
}
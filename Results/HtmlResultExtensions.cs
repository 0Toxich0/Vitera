namespace ViteraBackend.Results;

public static class HtmlResultExtensions
{
    public static IResult Html(this IResultExtensions extensions, string html)
        => new HtmlResult(html);
}
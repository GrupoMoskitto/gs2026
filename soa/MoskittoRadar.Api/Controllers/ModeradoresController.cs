using Microsoft.AspNetCore.Mvc;
using MoskittoRadar.Api.Seguranca;

namespace MoskittoRadar.Api.Controllers;

[ApiController]
[Route("api/moderadores")]
[Produces("application/json")]
public class ModeradoresController : ControllerBase
{
    /// <summary>Confere a chave e diz de quem ela é. O app de moderação usa isso na tela de entrada. 401 se a chave não valer.</summary>
    [HttpGet("eu")]
    [ExigeModerador]
    public IActionResult Eu() => Ok(new { Apelido = (string)HttpContext.Items[ExigeModeradorAttribute.ItemApelido]! });
}

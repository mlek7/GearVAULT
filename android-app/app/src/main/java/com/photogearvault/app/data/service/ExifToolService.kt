package com.photogearvault.app.data.service

import com.photogearvault.app.data.model.GearCategory
import com.photogearvault.app.data.model.GearExifMetadata
import com.photogearvault.app.data.model.GearItem

data class ExifToolPreset(
    val id: String,
    val name: String,
    val sampleImageUrl: String,
    val cameraName: String,
    val brand: String,
    val category: GearCategory,
    val bodySerialNumber: String,
    val lensModel: String,
    val lensSerialNumber: String,
    val shutterCount: Int,
    val firmware: String,
    val focalLength: String,
    val aperture: String,
    val iso: Int,
    val shutterSpeed: String
)

object ExifToolService {
    val PRESETS = listOf(
        ExifToolPreset(
            id = "sony-a7rv",
            name = "Sony Alpha 7R V + FE 24-70mm GM II",
            sampleImageUrl = "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
            cameraName = "Sony ILCE-7RM5 (Alpha 7R V)",
            brand = "Sony",
            category = GearCategory.CAMERA_BODY,
            bodySerialNumber = "SN-4820194",
            lensModel = "Sony FE 24-70mm F2.8 GM II (SEL2470GM2)",
            lensSerialNumber = "L-1903821",
            shutterCount = 14280,
            firmware = "Ver. 2.01",
            focalLength = "50mm",
            aperture = "f/2.8",
            iso = 100,
            shutterSpeed = "1/250s"
        ),
        ExifToolPreset(
            id = "canon-r5",
            name = "Canon EOS R5 + RF 50mm F1.2 L USM",
            sampleImageUrl = "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80",
            cameraName = "Canon EOS R5",
            brand = "Canon",
            category = GearCategory.CAMERA_BODY,
            bodySerialNumber = "CN-0938201103",
            lensModel = "Canon RF 50mm F1.2 L USM",
            lensSerialNumber = "RF-8829104",
            shutterCount = 8940,
            firmware = "Firmware Version 1.9.0",
            focalLength = "50mm",
            aperture = "f/1.2",
            iso = 200,
            shutterSpeed = "1/1000s"
        ),
        ExifToolPreset(
            id = "nikon-z8",
            name = "Nikon Z 8 + NIKKOR Z 85mm f/1.2 S",
            sampleImageUrl = "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=800&q=80",
            cameraName = "Nikon Z 8",
            brand = "Nikon",
            category = GearCategory.CAMERA_BODY,
            bodySerialNumber = "NK-6003921",
            lensModel = "NIKKOR Z 85mm f/1.2 S",
            lensSerialNumber = "NZ-2009418",
            shutterCount = 5120,
            firmware = "C:2.00",
            focalLength = "85mm",
            aperture = "f/1.2",
            iso = 64,
            shutterSpeed = "1/1600s"
        ),
        ExifToolPreset(
            id = "fujifilm-xt5",
            name = "Fujifilm X-T5 + XF 56mm f/1.2 R WR",
            sampleImageUrl = "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=800&q=80",
            cameraName = "FUJIFILM X-T5",
            brand = "Fujifilm",
            category = GearCategory.CAMERA_BODY,
            bodySerialNumber = "FJ-2DA03912",
            lensModel = "XF56mmF1.2 R WR",
            lensSerialNumber = "XF-701923",
            shutterCount = 3410,
            firmware = "Ver. 3.01",
            focalLength = "56mm",
            aperture = "f/1.2",
            iso = 125,
            shutterSpeed = "1/500s"
        )
    )

    fun createGearFromPreset(preset: ExifToolPreset): GearItem {
        return GearItem(
            id = "gear-exif-${System.currentTimeMillis()}",
            name = preset.cameraName,
            category = preset.category,
            serialNumber = preset.bodySerialNumber,
            image = preset.sampleImageUrl,
            notes = "Parsed via ExifTool standard metadata scanner.",
            brand = preset.brand,
            createdAt = java.time.Instant.now().toString(),
            exifMetadata = GearExifMetadata(
                cameraMake = preset.brand,
                cameraModel = preset.cameraName,
                lensModel = preset.lensModel,
                lensSerialNumber = preset.lensSerialNumber,
                bodySerialNumber = preset.bodySerialNumber,
                shutterCount = preset.shutterCount,
                firmwareVersion = preset.firmware,
                focalLength = preset.focalLength,
                maxAperture = preset.aperture,
                iso = preset.iso,
                shutterSpeed = preset.shutterSpeed,
                verifiedAt = java.time.Instant.now().toString()
            )
        )
    }
}
